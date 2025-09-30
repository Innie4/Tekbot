'use client';

import React, { useEffect, useRef, useState } from 'react';

interface WidgetMessage {
  type: 'WIDGET_READY' | 'WIDGET_RESIZE' | 'WIDGET_MESSAGE' | 'WIDGET_CONFIG_UPDATE' | 'WIDGET_ERROR';
  data?: any;
  source?: string;
}

interface WidgetIframeProps {
  tenantId: string;
  apiUrl: string;
  sessionId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  onMessage?: (message: any) => void;
  onReady?: () => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function WidgetIframe({
  tenantId,
  apiUrl,
  sessionId,
  customerId,
  metadata,
  onMessage,
  onReady,
  onError,
  className = '',
  style = {},
}: WidgetIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState<string>('');

  useEffect(() => {
    // Construct widget URL with parameters
    const params = new URLSearchParams({
      tenantId,
      apiUrl,
      ...(sessionId && { sessionId }),
      ...(customerId && { customerId }),
      ...(metadata && { metadata: JSON.stringify(metadata) }),
    });

    // In production, this would be your CDN URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://cdn.tekassist.com/widget' 
      : `${window.location.origin}/widget`;
    
    setWidgetUrl(`${baseUrl}/embed.html?${params.toString()}`);
  }, [tenantId, apiUrl, sessionId, customerId, metadata]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<WidgetMessage>) => {
      // Verify origin for security
      const allowedOrigins = [
        window.location.origin,
        'https://cdn.tekassist.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Received message from unauthorized origin:', event.origin);
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'WIDGET_READY':
          setIsReady(true);
          onReady?.();
          break;

        case 'WIDGET_RESIZE':
          if (iframeRef.current && data?.height) {
            iframeRef.current.style.height = `${data.height}px`;
          }
          break;

        case 'WIDGET_MESSAGE':
          onMessage?.(data);
          break;

        case 'WIDGET_ERROR':
          console.error('Widget error:', data);
          onError?.(data?.message || 'Unknown widget error');
          break;

        case 'WIDGET_CONFIG_UPDATE':
          // Handle configuration updates if needed
          break;

        default:
          console.log('Unknown widget message type:', type);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMessage, onReady, onError]);

  const sendMessageToWidget = (message: any) => {
    if (iframeRef.current && isReady) {
      iframeRef.current.contentWindow?.postMessage(message, '*');
    }
  };

  const updateConfig = (config: any) => {
    sendMessageToWidget({
      type: 'UPDATE_CONFIG',
      data: config,
    });
  };

  const sendChatMessage = (message: string) => {
    sendMessageToWidget({
      type: 'SEND_MESSAGE',
      data: { message },
    });
  };

  const openWidget = () => {
    sendMessageToWidget({
      type: 'OPEN_WIDGET',
    });
  };

  const closeWidget = () => {
    sendMessageToWidget({
      type: 'CLOSE_WIDGET',
    });
  };

  const resetConversation = () => {
    sendMessageToWidget({
      type: 'RESET_CONVERSATION',
    });
  };

  // Expose methods for parent component
  React.useImperativeHandle(null, () => ({
    sendMessage: sendChatMessage,
    updateConfig,
    openWidget,
    closeWidget,
    resetConversation,
    isReady,
  }));

  if (!widgetUrl) {
    return null;
  }

  return (
    <iframe
      ref={iframeRef}
      src={widgetUrl}
      className={`widget-iframe ${className}`}
      style={{
        border: 'none',
        width: '100%',
        height: '600px',
        ...style,
      }}
      allow="clipboard-write; microphone; camera"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      loading="lazy"
      title="TekAssist Chat Widget"
    />
  );
}

// Export utility functions for external use
export const WidgetAPI = {
  createWidget: (containerId: string, config: WidgetIframeProps) => {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    // This would be implemented with a framework-agnostic approach
    // For now, it's a placeholder for the actual implementation
    console.log('Creating widget in container:', containerId, config);
  },

  destroyWidget: (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  },
};