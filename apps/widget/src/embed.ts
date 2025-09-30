import React from 'react';
import { createRoot } from 'react-dom/client';
import { TekAssistWidget } from './widget';
import { WidgetConfig } from './widget/simple-types';

// Global interface for the embed script
interface TekAssistEmbed {
  init: (config: WidgetConfig) => void;
  destroy: () => void;
  getInstance: () => TekAssistWidget | null;
}

class EmbedManager implements TekAssistEmbed {
  private widget: TekAssistWidget | null = null;
  private container: HTMLElement | null = null;
  private root: any = null;
  private config: WidgetConfig | null = null;

  init(config: WidgetConfig): void {
    try {
      // Store config
      this.config = config;

      // Clean up existing instance
      this.destroy();

      // Create or find container
      this.container = document.getElementById('tekassist-widget-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'tekassist-widget-container';
        this.container.style.cssText = `
          position: fixed;
          z-index: 9999;
          pointer-events: none;
        `;
        document.body.appendChild(this.container);
      }

      // Create React root
      this.root = createRoot(this.container);
      
      // Create widget instance with proper props
      const widgetProps = {
        container: this.container,
        tenantId: this.config.tenantId || '',
         apiUrl: this.config.apiUrl || '',
         ...(this.config.sessionId && { sessionId: this.config.sessionId }),
         ...(this.config.customerId && { customerId: this.config.customerId }),
         ...(this.config.metadata && { metadata: this.config.metadata }),
         ...(this.config.onMessage && { onMessage: this.config.onMessage }),
         ...(this.config.onStateChange && { onStateChange: this.config.onStateChange }),
         ...(this.config.onError && { onError: this.config.onError }),
         ...(this.config.onResize && { onResize: this.config.onResize }),
      };

      this.widget = new TekAssistWidget(widgetProps);

      // The widget handles its own rendering internally
      // No need to call getComponent() as it renders itself

      console.log('TekAssist Widget initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TekAssist Widget:', error);
      throw error;
    }
  }

  destroy(): void {
    if (this.widget) {
      this.widget.destroy();
      this.widget = null;
    }

    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  getInstance(): TekAssistWidget | null {
    return this.widget;
  }
}

// Create global instance
const embedManager = new EmbedManager();

// Auto-initialize if config is available
if (typeof window !== 'undefined') {
  // Check for global config
  const globalConfig = (window as any).TekAssistConfig;
  if (globalConfig) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        embedManager.init(globalConfig);
      });
    } else {
      embedManager.init(globalConfig);
    }
  }

  // Expose to global scope
  (window as any).TekAssistEmbed = embedManager;
}

export default embedManager;