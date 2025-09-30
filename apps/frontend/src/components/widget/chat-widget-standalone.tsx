'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, MessageCircle, Bot, User } from 'lucide-react';
import { ThemeEngine, AdvancedThemeConfig } from '../../lib/theme-engine';

interface Message {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  isTyping?: boolean;
}

interface WidgetConfig {
  title: string;
  welcomeMessage?: string;
  placeholder?: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: {
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    fontSize?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    headerColor?: string;
    headerTextColor?: string;
  };
  branding: {
    logo?: string;
    companyName?: string;
    showPoweredBy?: boolean;
  };
  behavior: {
    autoOpen?: boolean;
    autoOpenDelay?: number;
    enableSound?: boolean;
    enableTypingIndicator?: boolean;
    maxHeight?: string;
    maxWidth?: string;
  };
}

interface ChatWidgetStandaloneProps {
  tenantId: string;
  apiUrl: string;
  sessionId?: string;
  onMessage?: (message: Message) => void;
  onConfigLoad?: (config: WidgetConfig) => void;
}

export default function ChatWidgetStandalone({
  tenantId,
  apiUrl,
  sessionId,
  onMessage,
  onConfigLoad,
}: ChatWidgetStandaloneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || generateSessionId());
  const [themeEngine, setThemeEngine] = useState<ThemeEngine | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Update theme when config changes
  useEffect(() => {
    if (themeEngine && config?.theme) {
      const themeConfig: AdvancedThemeConfig = {
        ...config.theme,
        components: {
          chatBubble: {
            ...(config.theme.primaryColor && { userBubbleColor: config.theme.primaryColor }),
            ...(config.theme.secondaryColor && { botBubbleColor: config.theme.secondaryColor }),
            ...(config.theme.buttonTextColor && { userTextColor: config.theme.buttonTextColor }),
            ...(config.theme.textColor && { botTextColor: config.theme.textColor }),
          },
          input: {
            ...(config.theme.backgroundColor && { backgroundColor: config.theme.backgroundColor }),
            ...(config.theme.secondaryColor && { borderColor: config.theme.secondaryColor }),
            ...(config.theme.primaryColor && { focusBorderColor: config.theme.primaryColor }),
          },
          button: {
            ...(config.theme.primaryColor && { hoverColor: config.theme.primaryColor }),
          },
          header: {
            gradient: `linear-gradient(135deg, ${config.theme.headerColor} 0%, ${config.theme.primaryColor} 100%)`,
          },
        },
      };
      themeEngine.applyTheme(themeConfig);
    }
  }, [themeEngine, config]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConfig();
    // Initialize theme engine
    const engine = new ThemeEngine();
    setThemeEngine(engine);
    
    return () => {
      engine.destroy();
    };
  }, [tenantId]);

  useEffect(() => {
    if (config?.behavior?.autoOpen && config.behavior.autoOpenDelay) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, config.behavior.autoOpenDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [config]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${apiUrl}/widget-config/public/${tenantId}`);
      if (response.ok) {
        const widgetConfig = await response.json();
        setConfig(widgetConfig);
        onConfigLoad?.(widgetConfig);
        
        // Add welcome message if configured
        if (widgetConfig.welcomeMessage) {
          const welcomeMessage: Message = {
            id: `welcome_${Date.now()}`,
            content: widgetConfig.welcomeMessage,
            direction: 'inbound',
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: inputValue.trim(),
      direction: 'outbound',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    onMessage?.(userMessage);

    try {
      // Create or get conversation
      if (!conversationId) {
        const convResponse = await fetch(`${apiUrl}/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            channel: 'web',
            metadata: {
              userAgent: navigator.userAgent,
              referrer: document.referrer,
              url: window.location.href,
            },
          }),
        });

        if (convResponse.ok) {
          const conversation = await convResponse.json();
          setConversationId(conversation.id);
        }
      }

      // Send message to AI
      const response = await fetch(`${apiUrl}/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({
          message: inputValue.trim(),
          conversationId,
          sessionId: currentSessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const botMessage: Message = {
          id: `bot_${Date.now()}`,
          content: data.response || data.message || 'Sorry, I could not process your request.',
          direction: 'inbound',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
        onMessage?.(botMessage);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content: 'Sorry, something went wrong. Please try again.',
        direction: 'inbound',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeWidget = () => {
    setIsMinimized(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  if (!config) {
    return null;
  }

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
      className={`fixed z-50 ${positionClasses[position]}`}
      style={widgetStyles}
    >
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleWidget}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: 'var(--button-color)',
            color: 'var(--button-text-color)',
          }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
            isMinimized ? 'h-12' : ''
          }`}
          style={{
            width: maxWidth,
            height: isMinimized ? '48px' : maxHeight,
            maxHeight,
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 rounded-t-lg"
            style={{
              backgroundColor: 'var(--header-color)',
              color: 'var(--header-text-color)',
              borderRadius: `var(--border-radius) var(--border-radius) 0 0`,
            }}
          >
            <div className="flex items-center space-x-2">
              {config.branding?.logo && (
                <img
                  src={config.branding.logo}
                  alt="Logo"
                  className="w-6 h-6 rounded-full"
                />
              )}
              <h3 className="font-semibold text-sm">
                {config.title}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={minimizeWidget}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={closeWidget}
                className="p-1 hover:bg-black/10 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 120px)' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-start space-x-2 max-w-[80%]">
                      {message.direction === 'inbound' && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--secondary-color)' }}
                        >
                          <Bot size={14} style={{ color: 'var(--primary-color)' }} />
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-lg text-sm ${
                          message.direction === 'outbound'
                            ? 'text-white'
                            : 'border'
                        }`}
                        style={{
                          backgroundColor: message.direction === 'outbound' 
                            ? 'var(--primary-color)' 
                            : 'var(--background-color)',
                          color: message.direction === 'outbound' 
                            ? 'var(--button-text-color)' 
                            : 'var(--text-color)',
                          borderColor: message.direction === 'inbound' 
                            ? 'var(--secondary-color)' 
                            : 'transparent',
                          borderRadius: 'var(--border-radius)',
                        }}
                      >
                        {message.content}
                      </div>
                      {message.direction === 'outbound' && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--secondary-color)' }}
                        >
                          <User size={14} style={{ color: 'var(--primary-color)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && config.behavior?.enableTypingIndicator && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--secondary-color)' }}
                      >
                        <Bot size={14} style={{ color: 'var(--primary-color)' }} />
                      </div>
                      <div
                        className="px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--background-color)',
                          borderColor: 'var(--secondary-color)',
                          borderRadius: 'var(--border-radius)',
                        }}
                      >
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={config.placeholder || 'Type your message...'}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                    style={{
                      borderColor: 'var(--secondary-color)',
                      borderRadius: 'var(--border-radius)',
                      fontSize: 'var(--font-size)',
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--button-color)',
                      color: 'var(--button-text-color)',
                      borderRadius: 'var(--border-radius)',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Powered By */}
              {config.branding?.showPoweredBy && (
                <div className="px-4 pb-2">
                  <div className="text-xs text-gray-500 text-center">
                    Powered by{' '}
                    <a
                      href="https://tekassist.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      TekAssist
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}