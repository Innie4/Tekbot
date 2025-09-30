export enum WidgetMessageTypes {
  INIT = 'widget:init',
  READY = 'widget:ready',
  OPEN = 'widget:open',
  CLOSE = 'widget:close',
  MINIMIZE = 'widget:minimize',
  MAXIMIZE = 'widget:maximize',
  RESIZE = 'widget:resize',
  MESSAGE = 'widget:message',
  TYPING = 'widget:typing',
  ERROR = 'widget:error',
  STATUS_CHANGE = 'widget:status-change',
  CONFIG_UPDATE = 'widget:config-update',
  THEME_CHANGE = 'widget:theme-change',
}

export interface WidgetMessage {
  type: WidgetMessageTypes;
  data?: any;
  timestamp?: number;
  id?: string;
}

export interface WidgetMessageHandler {
  (message: WidgetMessage): void;
}

export class WidgetMessaging {
  private handlers: Map<WidgetMessageTypes, Set<WidgetMessageHandler>> = new Map();
  private allowedOrigins: Set<string> = new Set();
  private isInitialized: boolean = false;

  constructor(allowedOrigins: string[] = []) {
    this.allowedOrigins = new Set(allowedOrigins);
    this.setupMessageListener();
  }

  /**
   * Initialize messaging system
   */
  init(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    
    // Add current origin as allowed
    if (typeof window !== 'undefined') {
      this.allowedOrigins.add(window.location.origin);
    }
  }

  /**
   * Add allowed origin for cross-origin messaging
   */
  addAllowedOrigin(origin: string): void {
    this.allowedOrigins.add(origin);
  }

  /**
   * Remove allowed origin
   */
  removeAllowedOrigin(origin: string): void {
    this.allowedOrigins.delete(origin);
  }

  /**
   * Subscribe to widget messages
   */
  subscribe(type: WidgetMessageTypes, handler: WidgetMessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  /**
   * Unsubscribe from widget messages
   */
  unsubscribe(type: WidgetMessageTypes, handler: WidgetMessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  /**
   * Send message to parent window (for iframe integration)
   */
  sendToParent(message: WidgetMessage): void {
    if (typeof window !== 'undefined' && window.parent !== window) {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
        id: this.generateMessageId(),
      };
      
      window.parent.postMessage(messageWithTimestamp, '*');
    }
  }

  /**
   * Send message to iframe (for parent window)
   */
  sendToIframe(iframe: HTMLIFrameElement, message: WidgetMessage): void {
    if (iframe && iframe.contentWindow) {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
        id: this.generateMessageId(),
      };
      
      iframe.contentWindow.postMessage(messageWithTimestamp, '*');
    }
  }

  /**
   * Emit message to local handlers
   */
  emit(type: WidgetMessageTypes, data?: any): void {
    const message: WidgetMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    };

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in widget message handler:', error);
        }
      });
    }
  }

  /**
   * Setup message listener for cross-origin communication
   */
  private setupMessageListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('message', (event) => {
      // Validate origin if origins are specified
      if (this.allowedOrigins.size > 0 && !this.allowedOrigins.has(event.origin)) {
        return;
      }

      // Validate message format
      if (!this.isValidWidgetMessage(event.data)) {
        return;
      }

      const message = event.data as WidgetMessage;
      
      // Emit to local handlers
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in widget message handler:', error);
          }
        });
      }
    });
  }

  /**
   * Validate widget message format
   */
  private isValidWidgetMessage(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      Object.values(WidgetMessageTypes).includes(data.type)
    );
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `widget-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up messaging system
   */
  cleanup(): void {
    this.handlers.clear();
    this.isInitialized = false;
  }

  /**
   * Clean up event listeners and handlers
   */
  destroy(): void {
    this.handlers.clear();
    this.isInitialized = false;
  }
}

/**
 * Create a widget message
 */
export function createWidgetMessage(type: WidgetMessageTypes, data?: any): WidgetMessage {
  return {
    type,
    data,
    timestamp: Date.now(),
    id: `widget-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Global messaging instance
 */
export const globalWidgetMessaging = new WidgetMessaging();

// Auto-initialize
if (typeof window !== 'undefined') {
  globalWidgetMessaging.init();
}