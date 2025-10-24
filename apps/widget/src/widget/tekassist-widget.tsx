import React, { useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatWidgetStandalone } from './chat-widget-standalone';
import { WidgetMessaging, WidgetMessageTypes } from '../utils/widget-messaging';
import {
  WidgetConfig,
  WidgetProps,
  WidgetState,
  WidgetCallbacks,
} from './widget-types';

export class TekAssistWidget {
  private container: HTMLElement;
  private root: Root | null = null;
  private messaging: WidgetMessaging;
  private options: WidgetProps;
  private config: WidgetConfig | null = null;
  private isInitialized = false;
  private widgetId: string;
  private state: WidgetState = {
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    conversationId: null,
    sessionId: null,
    messages: [],
    unreadCount: 0,
  };

  constructor(options: WidgetProps) {
    this.options = options;
    this.container = options.container;
    this.widgetId = `tekassist-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.messaging = new WidgetMessaging();
    // Initialize messaging to set allowed origins and internal state
    this.messaging.init();

    this.setupMessaging();
    this.init();
  }

  private setupMessaging(): void {
    // Listen for parent messages
    this.messaging.subscribe(WidgetMessageTypes.OPEN, () => this.open());
    this.messaging.subscribe(WidgetMessageTypes.CLOSE, () => this.close());
    this.messaging.subscribe(WidgetMessageTypes.MINIMIZE, () =>
      this.minimize(),
    );
    this.messaging.subscribe(WidgetMessageTypes.MAXIMIZE, () =>
      this.maximize(),
    );
    this.messaging.subscribe(WidgetMessageTypes.MESSAGE, data =>
      this.sendMessage(data.data?.message),
    );
    this.messaging.subscribe(WidgetMessageTypes.CONFIG_UPDATE, data =>
      this.updateConfig(data.data?.config),
    );
    // Note: No RESET type in enum, using STATUS_CHANGE for reset functionality
    this.messaging.subscribe(WidgetMessageTypes.STATUS_CHANGE, data => {
      if (data.data?.action === 'reset') {
        this.reset();
      }
    });
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configuration
      await this.loadConfig();

      // Create React root
      this.root = createRoot(this.container);

      // Render widget
      this.renderWidget();

      this.isInitialized = true;

      // Emit widget ready event
      this.messaging.emit(WidgetMessageTypes.READY, {
        widgetId: this.widgetId,
        config: this.config,
      });

      // Emit widget open event
      this.messaging.emit(WidgetMessageTypes.OPEN, {
        widgetId: this.widgetId,
      });

      // Auto-open if configured
      if (this.config?.behavior?.autoOpen) {
        const delay = this.config.behavior.autoOpenDelay || 0;
        setTimeout(() => this.open(), delay);
      }
    } catch (error) {
      console.error('Failed to initialize widget:', error);
      this.messaging.sendToParent({
        type: WidgetMessageTypes.ERROR,
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const response = await fetch(
        `${this.options.apiUrl}/widget-config/public/${this.options.tenantId}`,
      );
      if (response.ok) {
        this.config = await response.json();
      } else {
        // Use default config if API fails
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): WidgetConfig {
    return {
      tenantId: this.options.tenantId || 'default',
      apiUrl: this.options.apiUrl || 'https://api.tekassist.com',
      title: 'Chat Support',
      welcomeMessage: 'Hi! How can I help you today?',
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
        companyName: 'TekAssist',
        showPoweredBy: true,
      },
      behavior: {
        autoOpen: false,
        autoOpenDelay: 0,
        enableSound: true,
        enableTypingIndicator: true,
        maxHeight: '600px',
        maxWidth: '400px',
      },
    };
  }

  private renderWidget(): void {
    if (!this.root || !this.config) return;

    const callbacks: WidgetCallbacks = {
      onMessage: message => {
        this.options.onMessage?.(message);
        this.messaging.sendToParent({
          type: WidgetMessageTypes.MESSAGE,
          data: message,
        });
      },
      onStateChange: newState => {
        this.state = { ...this.state, ...newState };
        this.options.onStateChange?.(this.state);
        this.messaging.sendToParent({
          type: WidgetMessageTypes.STATUS_CHANGE,
          data: this.state,
        });
      },
      onError: error => {
        this.options.onError?.(error);
        this.messaging.sendToParent({
          type: WidgetMessageTypes.ERROR,
          data: error,
        });
      },
      onResize: dimensions => {
        this.options.onResize?.(dimensions);
        this.messaging.sendToParent({
          type: WidgetMessageTypes.RESIZE,
          data: dimensions,
        });
      },
    };

    this.root.render(
      React.createElement(ChatWidgetStandalone, {
        config: this.config,
        tenantId: this.options.tenantId,
        apiUrl: this.options.apiUrl,
        sessionId: this.options.sessionId,
        customerId: this.options.customerId,
        metadata: this.options.metadata,
        initialState: this.state,
        callbacks,
      }),
    );
  }

  // Public API methods
  public open(): void {
    this.state.isOpen = true;
    this.state.isMinimized = false;
    this.renderWidget();
  }

  public close(): void {
    this.state.isOpen = false;
    this.state.isMinimized = false;
    this.renderWidget();
  }

  public minimize(): void {
    this.state.isMinimized = true;
    this.renderWidget();
  }

  public maximize(): void {
    this.state.isMinimized = false;
    this.renderWidget();
  }

  public sendMessage(message: string): void {
    // This will be handled by the ChatWidgetStandalone component
    this.messaging.emit(WidgetMessageTypes.MESSAGE, { message });
  }

  public updateConfig(newConfig: Partial<WidgetConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
      this.renderWidget();
    }
  }

  public reset(): void {
    this.state = {
      isOpen: false,
      isMinimized: false,
      isLoading: false,
      conversationId: null,
      sessionId: this.options.sessionId || null,
      messages: [],
      unreadCount: 0,
    };
    this.renderWidget();
  }

  public getState(): WidgetState {
    return { ...this.state };
  }

  public getConfig(): WidgetConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Subscribe to widget events
   */
  public subscribe(
    type: WidgetMessageTypes,
    handler: (message: any) => void,
  ): () => void {
    return this.messaging.subscribe(type, handler);
  }

  /**
   * Unsubscribe from widget events
   */
  public unsubscribe(
    type: WidgetMessageTypes,
    handler: (message: any) => void,
  ): void {
    this.messaging.unsubscribe(type, handler);
  }

  public destroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    // Clean up messaging handlers/state before destroy
    this.messaging.cleanup();
    this.messaging.destroy();
    this.isInitialized = false;
  }
}
