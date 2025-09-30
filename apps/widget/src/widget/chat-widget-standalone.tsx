import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, MessageCircle, Bot, User } from 'lucide-react';
import { WidgetConfig, WidgetState, WidgetCallbacks, ChatMessage } from './widget-types';

interface ChatWidgetStandaloneProps {
  config: WidgetConfig;
  tenantId: string;
  apiUrl: string;
  sessionId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  initialState?: WidgetState;
  callbacks: WidgetCallbacks;
}

export function ChatWidgetStandalone({
  config,
  tenantId,
  apiUrl,
  sessionId,
  customerId,
  metadata,
  initialState,
  callbacks,
}: ChatWidgetStandaloneProps) {
  const [isOpen, setIsOpen] = useState(initialState?.isOpen || false);
  const [isMinimized, setIsMinimized] = useState(initialState?.isMinimized || false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialState?.messages || []);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialState?.conversationId || null);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || generateSessionId());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    // Add welcome message if configured and no messages exist
    if (config.welcomeMessage && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        content: config.welcomeMessage,
        direction: 'inbound',
        timestamp: new Date(),
        metadata: {
          type: 'welcome',
          source: 'system',
        },
      };
      setMessages([welcomeMessage]);
    }
  }, [config.welcomeMessage]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: inputValue.trim(),
      direction: 'outbound',
      timestamp: new Date(),
      metadata: {
        sessionId: currentSessionId,
        ...(customerId && { customerId }),
        ...metadata,
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    // Notify parent of new message
    callbacks.onMessage?.(userMessage);

    try {
      const response = await fetch(`${apiUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          tenantId,
          sessionId: currentSessionId,
          conversationId,
          customerId,
          metadata,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update conversation ID if provided
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        const botMessage: ChatMessage = {
          id: data.messageId || `bot_${Date.now()}`,
          content: data.message || data.response || 'Sorry, I could not process your request.',
          direction: 'inbound',
          timestamp: new Date(),
          metadata: {
            conversationId: data.conversationId,
            sessionId: currentSessionId,
            ...data.metadata,
          },
        };

        setMessages(prev => [...prev, botMessage]);
        callbacks.onMessage?.(botMessage);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        direction: 'inbound',
        timestamp: new Date(),
        metadata: {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };

      setMessages(prev => [...prev, errorMessage]);
      callbacks.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleWidget = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    setIsMinimized(false);
    
    callbacks.onStateChange?.({
      isOpen: newIsOpen,
      isMinimized: false,
      isLoading,
      conversationId,
      sessionId: currentSessionId,
      messages,
      unreadCount: 0,
    });
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
    
    callbacks.onStateChange?.({
      isOpen,
      isMinimized: true,
      isLoading,
      conversationId,
      sessionId: currentSessionId,
      messages,
      unreadCount: 0,
    });
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
    
    callbacks.onStateChange?.({
      isOpen: false,
      isMinimized: false,
      isLoading,
      conversationId,
      sessionId: currentSessionId,
      messages,
      unreadCount: 0,
    });
  };

  const theme = config.theme || {};
  const position = config.position || 'bottom-right';
  const maxHeight = config.behavior?.maxHeight || '600px';
  const maxWidth = config.behavior?.maxWidth || '400px';

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const widgetStyles = {
    '--primary-color': theme.primaryColor || '#3B82F6',
    '--secondary-color': theme.secondaryColor || '#EFF6FF',
    '--text-color': theme.textColor || '#1F2937',
    '--background-color': theme.backgroundColor || '#FFFFFF',
    '--border-radius': theme.borderRadius || '8px',
    '--font-family': theme.fontFamily || 'system-ui, -apple-system, sans-serif',
    '--font-size': theme.fontSize || '14px',
    '--button-color': theme.buttonColor || '#3B82F6',
    '--button-text-color': theme.buttonTextColor || '#FFFFFF',
    '--header-color': theme.headerColor || '#3B82F6',
    '--header-text-color': theme.headerTextColor || '#FFFFFF',
  } as React.CSSProperties;

  return (
    <div 
      id="tekassist-widget-root"
      className={`tw-fixed tw-z-50 ${positionClasses[position]}`}
      style={widgetStyles}
    >
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleWidget}
          className="tw-w-14 tw-h-14 tw-rounded-full tw-shadow-lg tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-200 hover:tw-scale-110"
          style={{
            backgroundColor: 'var(--button-color)',
            color: 'var(--button-text-color)',
          }}
          aria-label="Open chat widget"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-border tw-flex tw-flex-col tw-overflow-hidden"
          style={{
            width: maxWidth,
            height: isMinimized ? '60px' : maxHeight,
            backgroundColor: 'var(--background-color)',
            borderRadius: 'var(--border-radius)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size)',
          }}
        >
          {/* Header */}
          <div
            className="tw-p-4 tw-flex tw-items-center tw-justify-between"
            style={{
              backgroundColor: 'var(--header-color)',
              color: 'var(--header-text-color)',
            }}
          >
            <div className="tw-flex tw-items-center tw-space-x-2">
              <MessageCircle size={20} />
              <span className="tw-font-medium">{config.title}</span>
            </div>
            <div className="tw-flex tw-items-center tw-space-x-1">
              <button
                onClick={minimizeWidget}
                className="tw-p-1 hover:tw-bg-black/10 tw-rounded tw-transition-colors"
                aria-label="Minimize widget"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={closeWidget}
                className="tw-p-1 hover:tw-bg-black/10 tw-rounded tw-transition-colors"
                aria-label="Close widget"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 tw-space-y-3" style={{ height: 'calc(100% - 120px)' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`tw-flex ${message.direction === 'outbound' ? 'tw-justify-end' : 'tw-justify-start'}`}
                  >
                    <div className="tw-flex tw-items-start tw-space-x-2 tw-max-w-[80%]">
                      {message.direction === 'inbound' && (
                        <div
                          className="tw-w-6 tw-h-6 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
                          style={{ backgroundColor: 'var(--secondary-color)' }}
                        >
                          <Bot size={14} style={{ color: 'var(--primary-color)' }} />
                        </div>
                      )}
                      <div
                        className={`tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm ${
                          message.direction === 'outbound'
                            ? 'tw-text-white'
                            : 'tw-border'
                        }`}
                        style={
                          message.direction === 'outbound'
                            ? {
                                backgroundColor: 'var(--primary-color)',
                                borderRadius: 'var(--border-radius)',
                              }
                            : {
                                backgroundColor: 'var(--background-color)',
                                borderColor: 'var(--secondary-color)',
                                borderRadius: 'var(--border-radius)',
                                color: 'var(--text-color)',
                              }
                        }
                      >
                        {message.content}
                      </div>
                      {message.direction === 'outbound' && (
                        <div
                          className="tw-w-6 tw-h-6 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
                          style={{ backgroundColor: 'var(--secondary-color)' }}
                        >
                          <User size={14} style={{ color: 'var(--primary-color)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="tw-flex tw-justify-start">
                    <div className="tw-flex tw-items-start tw-space-x-2 tw-max-w-[80%]">
                      <div
                        className="tw-w-6 tw-h-6 tw-rounded-full tw-flex tw-items-center tw-justify-center"
                        style={{ backgroundColor: 'var(--secondary-color)' }}
                      >
                        <Bot size={14} style={{ color: 'var(--primary-color)' }} />
                      </div>
                      <div
                        className="tw-px-3 tw-py-2 tw-rounded-lg tw-border"
                        style={{
                          backgroundColor: 'var(--background-color)',
                          borderColor: 'var(--secondary-color)',
                          borderRadius: 'var(--border-radius)',
                        }}
                      >
                        <div className="tw-flex tw-space-x-1">
                          <div className="tw-w-2 tw-h-2 tw-bg-gray-400 tw-rounded-full tw-animate-bounce"></div>
                          <div className="tw-w-2 tw-h-2 tw-bg-gray-400 tw-rounded-full tw-animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="tw-w-2 tw-h-2 tw-bg-gray-400 tw-rounded-full tw-animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="tw-p-4 tw-border-t">
                <div className="tw-flex tw-space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={config.placeholder || 'Type your message...'}
                    disabled={isLoading}
                    className="tw-flex-1 tw-px-3 tw-py-2 tw-border tw-rounded-md tw-text-sm tw-outline-none focus:tw-ring-2 focus:tw-ring-opacity-50"
                    style={{
                      borderColor: 'var(--secondary-color)',
                      borderRadius: 'var(--border-radius)',
                      color: 'var(--text-color)',
                      backgroundColor: 'var(--background-color)',
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="tw-px-4 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--button-color)',
                      color: 'var(--button-text-color)',
                      borderRadius: 'var(--border-radius)',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* Powered by */}
                {config.branding?.showPoweredBy && (
                  <div className="tw-mt-2 tw-text-center">
                    <span className="tw-text-xs tw-text-gray-500">
                      Powered by{' '}
                      <a
                        href="https://tekassist.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:tw-underline"
                        style={{ color: 'var(--primary-color)' }}
                      >
                        {config.branding?.companyName || 'TekAssist'}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}