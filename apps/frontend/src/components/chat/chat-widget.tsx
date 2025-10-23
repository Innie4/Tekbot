import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp?: Date;
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hi! I'm TekAssist. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketInstance = io(apiUrl, {
      query: {
        tenantId: 'default-tenant',
        sessionId: sessionId,
      },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketInstance.on('connected', (data: any) => {
      console.log('WebSocket connection confirmed:', data);
    });

    socketInstance.on('chat_response', (data: any) => {
      const botMessage: Message = {
        sender: 'bot',
        text: data.message || "Sorry, I couldn't process your request.",
        timestamp: new Date(data.timestamp || Date.now()),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
    });

    socketInstance.on('chat_error', (data: any) => {
      const errorMessage: Message = {
        sender: 'bot',
        text: data.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(data.timestamp || Date.now()),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    });

    socketInstance.on('typing', (data: any) => {
      if (data.sessionId !== sessionId) {
        // Handle typing indicator if needed
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    socketInstance.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'Sorry, I encountered a connection error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !socket) return;

    const userMessage: Message = {
      sender: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Send message via WebSocket
    socket.emit('chat_message', {
      message: messageContent,
      sessionId: sessionId,
      tenantId: 'default-tenant',
      conversationId,
    });

    // Set a timeout to handle cases where no response is received
    setTimeout(() => {
      if (isLoading) {
        const timeoutMessage: Message = {
          sender: 'bot',
          text: 'Sorry, the response is taking longer than expected. Please try again.',
        };
        setMessages((prev) => [...prev, timeoutMessage]);
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout
  };

  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="w-full max-w-3xl glass-card shadow-2xl rounded-2xl border border-gray-800">
        <div className="p-5 border-b border-gray-700 bg-tech-dark rounded-t-2xl flex items-center justify-between">
          <span className="font-bold text-2xl text-electric-blue">TekAssist Bot</span>
          <span className="text-xs text-gray-400">AI Assistant</span>
        </div>
        <div className="p-6 h-64 overflow-y-auto bg-background text-foreground rounded-b-xl">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
            >
              <span
                className={`inline-block px-4 py-2 rounded-xl shadow ${msg.sender === 'bot' ? 'bg-glass text-white' : 'bg-electric-cyan text-white'}`}
              >
                {msg.text}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="mb-3 flex justify-start">
              <span className="inline-block px-4 py-2 rounded-xl shadow bg-glass text-white">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 flex bg-background rounded-b-2xl border-t border-gray-700">
          <input
            className="flex-1 glass-input px-4 py-3 rounded-xl mr-3 text-foreground border border-gray-700 focus:outline-none focus:ring-2 focus:ring-electric-blue"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <button
            className="glass-button px-6 py-3 rounded-xl text-electric-blue font-bold shadow hover:bg-electric-blue hover:text-white transition disabled:opacity-50"
            onClick={sendMessage}
            disabled={isLoading || !socket}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
