'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidgetStandalone from './chat-widget-standalone';
import {
  WidgetMessaging,
  WidgetMessageTypes,
  createWidgetMessage,
} from '../../lib/widget-messaging';

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

interface WidgetOptions {
  container: HTMLElement;
  tenantId: string;
  apiUrl: string;
  sessionId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  onMessage?: (message: any) => void;
  onResize?: (height: number) => void;
  onError?: (error: any) => void;
}

class TekAssistWidget {
  private container: HTMLElement;
  private root: any;
  private messaging: WidgetMessaging;
  private options: WidgetOptions;
  private widgetRef: React.RefObject<any>;
  private config: WidgetConfig | null = null;
  private isInitialized = false;

  constructor(options: WidgetOptions) {
    this.options = options;
    this.container = options.container;
    this.widgetRef = React.createRef();
    this.messaging = new WidgetMessaging();

    this.setupMessaging();
  }

  private setupMessaging(): void {
    this.messaging.init();

    // Handle messages from parent window
    this.messaging.on(WidgetMessageTypes.UPDATE_CONFIG, (message) => {
      this.updateConfig(message.data);
    });

    this.messaging.on(WidgetMessageTypes.SEND_MESSAGE, (message) => {
      this.sendMessage(message.data.message);
    });

    this.messaging.on(WidgetMessageTypes.OPEN_WIDGET, () => {
      this.open();
    });

    this.messaging.on(WidgetMessageTypes.CLOSE_WIDGET, () => {
      this.close();
    });

    this.messaging.on(WidgetMessageTypes.RESET_CONVERSATION, () => {
      this.resetConversation();
    });
  }

  async init(): Promise<void> {
    try {
      // Load configuration
      await this.loadConfig();

      // Create React root and render widget
      this.root = createRoot(this.container);
      this.renderWidget();

      this.isInitialized = true;

      // Notify parent that widget is ready
      this.messaging.sendToParent(
        createWidgetMessage(WidgetMessageTypes.WIDGET_READY, {
          tenantId: this.options.tenantId,
          sessionId: this.options.sessionId,
        })
      );

      // Initial resize notification
      this.notifyResize();
    } catch (error) {
      console.error('Widget initialization failed:', error);
      this.messaging.sendToParent(
        createWidgetMessage(WidgetMessageTypes.WIDGET_ERROR, {
          message: error instanceof Error ? error.message : 'Unknown initialization error',
        })
      );
      throw error;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const response = await fetch(
        `${this.options.apiUrl}/widget-config/public/${this.options.tenantId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      this.config = await response.json();
    } catch (error) {
      console.error('Failed to load widget config:', error);
      // Use default config
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): WidgetConfig {
    return {
      title: 'Chat Support',
      welcomeMessage: 'Hello! How can I help you today?',
      placeholder: 'Type your message...',
      position: 'bottom-right',
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#EFF6FF',
        textColor: '#1F2937',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        buttonColor: '#3B82F6',
        buttonTextColor: '#FFFFFF',
        headerColor: '#3B82F6',
        headerTextColor: '#FFFFFF',
      },
      branding: {
        showPoweredBy: true,
      },
      behavior: {
        autoOpen: false,
        enableTypingIndicator: true,
        maxHeight: '600px',
        maxWidth: '400px',
      },
    };
  }

  private renderWidget(): void {
    if (!this.root || !this.config) return;

    this.root.render(
      React.createElement(ChatWidgetStandalone, {
        tenantId: this.options.tenantId,
        apiUrl: this.options.apiUrl,
        ...(this.options.sessionId && { sessionId: this.options.sessionId }),
        onMessage: (message: any) => {
          this.options.onMessage?.(message);
          this.messaging.sendToParent(
            createWidgetMessage(WidgetMessageTypes.WIDGET_MESSAGE, message)
          );
        },
        onConfigLoad: (config: WidgetConfig) => {
          this.config = config;
          this.notifyResize();
        },
      })
    );
  }

  private notifyResize(): void {
    // Use ResizeObserver for accurate height detection
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        this.options.onResize?.(height);
        this.messaging.sendToParent(
          createWidgetMessage(WidgetMessageTypes.WIDGET_RESIZE, { height })
        );
      }
    });

    resizeObserver.observe(this.container);
  }

  updateConfig(newConfig: Partial<WidgetConfig>): void {
    if (!this.config) return;

    this.config = { ...this.config, ...newConfig };
    this.renderWidget();

    this.messaging.sendToParent(
      createWidgetMessage(WidgetMessageTypes.CONFIG_UPDATED, this.config)
    );
  }

  sendMessage(message: string): void {
    if (this.widgetRef.current && this.widgetRef.current.sendMessage) {
      this.widgetRef.current.sendMessage(message);
    }
  }

  open(): void {
    if (this.widgetRef.current && this.widgetRef.current.open) {
      this.widgetRef.current.open();
    }
  }

  close(): void {
    if (this.widgetRef.current && this.widgetRef.current.close) {
      this.widgetRef.current.close();
    }
  }

  resetConversation(): void {
    if (this.widgetRef.current && this.widgetRef.current.resetConversation) {
      this.widgetRef.current.resetConversation();
    }

    this.messaging.sendToParent(createWidgetMessage(WidgetMessageTypes.CONVERSATION_RESET));
  }

  destroy(): void {
    if (this.root) {
      this.root.unmount();
    }

    this.messaging.destroy();
    this.isInitialized = false;
  }

  getConfig(): WidgetConfig | null {
    return this.config;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Make TekAssistWidget available globally
declare global {
  interface Window {
    TekAssistWidget: typeof TekAssistWidget;
    widgetInstance?: TekAssistWidget;
  }
}

window.TekAssistWidget = TekAssistWidget;

// Auto-initialize if container is found
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('widget-root');
  if (container) {
    // This will be handled by embed.html
    console.log('Widget container found, waiting for initialization...');
  }
});

export default TekAssistWidget;
