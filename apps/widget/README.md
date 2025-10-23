# TekAssist Widget

A lightweight, embeddable chat widget for integrating TekAssist AI assistant into any website or application.

## Features

- 🚀 **Easy Integration** - Multiple integration methods (Script tag, iframe, NPM package)
- 🎨 **Customizable Theming** - Dynamic theming with CSS variables and component-specific styling
- 📱 **Responsive Design** - Works seamlessly across desktop, tablet, and mobile devices
- 🔒 **Secure** - Cross-origin messaging with origin validation and CSP compliance
- ⚡ **Lightweight** - Optimized bundle size with tree-shaking support
- 🎯 **TypeScript** - Full TypeScript support with comprehensive type definitions
- 🔧 **Configurable** - Extensive configuration options for behavior and appearance
- 🌐 **Cross-Origin** - Secure iframe isolation prevents conflicts with parent site

## Installation

### NPM Package (Recommended for React apps)

```bash
npm install @tekassist/widget
```

### CDN (For any website)

```html
<script src="https://cdn.tekassist.com/widget/v1/tekassist-widget.min.js"></script>
```

### Script Tag (Self-hosted)

```html
<script src="/widget/embed.js"></script>
```

## Quick Start

### React Component

```tsx
import React from 'react';
import { TekAssistWidget } from '@tekassist/widget';

function App() {
  return (
    <div>
      <h1>My Website</h1>

      <TekAssistWidget
        tenantId='your-tenant-id'
        apiUrl='https://api.tekassist.com'
        position='bottom-right'
        theme='light'
      />
    </div>
  );
}
```

### React Hook

```tsx
import { useTekAssistWidget } from '@tekassist/widget';

function MyComponent() {
  const { open, close, sendMessage, state } = useTekAssistWidget({
    tenantId: 'your-tenant-id',
    apiUrl: 'https://api.tekassist.com',
  });

  return (
    <div>
      <button onClick={open}>Open Chat</button>
      <button onClick={close}>Close Chat</button>
      <button onClick={() => sendMessage('Hello!')}>Send Message</button>
      <p>Status: {state.status}</p>
    </div>
  );
}
```

### Script Tag Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <h1>Welcome to my website</h1>

    <!-- Widget container -->
    <div id="tekassist-widget-container"></div>

    <!-- Widget script -->
    <script>
      window.TekAssistConfig = {
        tenantId: 'your-tenant-id',
        apiUrl: 'https://api.tekassist.com',
        position: 'bottom-right',
        theme: 'light',
        features: {
          autoOpen: false,
          sound: true,
          typing: true,
        },
      };
    </script>
    <script src="/widget/embed.js"></script>
  </body>
</html>
```

### iframe Integration

```html
<iframe
  src="/widget/embed.html?tenantId=your-tenant-id&apiUrl=https://api.tekassist.com"
  style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 600px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 9999;
    "
></iframe>
```

## Configuration

### Basic Configuration

```typescript
interface WidgetConfig {
  tenantId: string; // Required: Your TekAssist tenant ID
  apiUrl: string; // Required: TekAssist API endpoint
  position?: string; // Widget position: 'bottom-right', 'bottom-left', etc.
  theme?: string; // Theme: 'light', 'dark', 'auto', 'custom'
  size?: string; // Size: 'small', 'medium', 'large', 'custom'
}
```

### Advanced Configuration

```typescript
const config = {
  tenantId: 'your-tenant-id',
  apiUrl: 'https://api.tekassist.com',

  // Positioning
  position: 'bottom-right',
  customPosition: {
    bottom: '20px',
    right: '20px',
  },

  // Sizing
  size: 'medium',
  customSize: {
    width: '400px',
    height: '600px',
  },

  // Features
  features: {
    autoOpen: false,
    sound: true,
    typing: true,
    fileUpload: true,
    emoji: true,
    markdown: true,
    voiceInput: false,
  },

  // Branding
  branding: {
    logo: 'https://example.com/logo.png',
    companyName: 'Your Company',
    welcomeMessage: 'Hello! How can I help you today?',
    colors: {
      primary: '#3B82F6',
      secondary: '#EFF6FF',
      accent: '#F59E0B',
    },
  },

  // Behavior
  behavior: {
    autoMinimize: true,
    minimizeTimeout: 30000,
    persistConversation: true,
    showTypingIndicator: true,
    maxMessages: 100,
  },

  // Callbacks
  callbacks: {
    onReady: () => console.log('Widget ready'),
    onOpen: () => console.log('Widget opened'),
    onClose: () => console.log('Widget closed'),
    onMessage: message => console.log('New message:', message),
    onError: error => console.error('Widget error:', error),
  },
};
```

## Theming

### CSS Variables

The widget uses CSS variables for theming, allowing easy customization:

```css
:root {
  --tekassist-primary-color: #3b82f6;
  --tekassist-secondary-color: #eff6ff;
  --tekassist-background-color: #ffffff;
  --tekassist-text-color: #1f2937;
  --tekassist-border-radius: 12px;
  --tekassist-font-family: 'Inter', sans-serif;
  --tekassist-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}
```

### Dynamic Theming

```typescript
import { ThemeEngine } from '@tekassist/widget';

const themeEngine = new ThemeEngine();

// Apply theme
themeEngine.applyTheme({
  primaryColor: '#3B82F6',
  secondaryColor: '#EFF6FF',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  borderRadius: '12px',
});

// Component-specific styling
themeEngine.applyComponentStyles('chatBubble', {
  backgroundColor: '#F3F4F6',
  borderRadius: '18px',
  padding: '12px 16px',
});
```

### Theme Presets

```typescript
// Light theme
const lightTheme = {
  primaryColor: '#3B82F6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
};

// Dark theme
const darkTheme = {
  primaryColor: '#60A5FA',
  backgroundColor: '#1F2937',
  textColor: '#F9FAFB',
};

// Apply theme
widget.updateTheme(darkTheme);
```

## API Reference

### Widget Class

```typescript
class TekAssistWidget {
  constructor(config: WidgetConfig);

  // Lifecycle
  init(): Promise<void>;
  destroy(): void;

  // State management
  open(): void;
  close(): void;
  minimize(): void;
  maximize(): void;

  // Messaging
  sendMessage(message: string): Promise<void>;

  // Configuration
  updateConfig(config: Partial<WidgetConfig>): void;
  updateTheme(theme: Partial<ThemeConfig>): void;

  // State access
  getState(): WidgetState;
  getConfig(): WidgetConfig;

  // Events
  addEventListener(type: string, handler: Function): void;
  removeEventListener(type: string, handler: Function): void;
}
```

### React Hook

```typescript
function useTekAssistWidget(options: WidgetConfig) {
  return {
    widget: TekAssistWidget | null,
    state: WidgetState,
    isReady: boolean,
    error: Error | null,

    // Actions
    init: () => Promise<void>,
    destroy: () => void,
    open: () => void,
    close: () => void,
    sendMessage: (message: string) => Promise<void>,
    updateConfig: (config: Partial<WidgetConfig>) => void,

    // Events
    addEventListener: (type: string, handler: Function) => void,
    removeEventListener: (type: string, handler: Function) => void
  };
}
```

## Events

The widget emits various events that you can listen to:

```typescript
widget.addEventListener('widget:ready', () => {
  console.log('Widget is ready');
});

widget.addEventListener('widget:open', () => {
  console.log('Widget opened');
});

widget.addEventListener('widget:message', event => {
  console.log('New message:', event.data.message);
});

widget.addEventListener('widget:error', event => {
  console.error('Widget error:', event.data.error);
});
```

Available events:

- `widget:ready` - Widget initialization complete
- `widget:open` - Widget opened
- `widget:close` - Widget closed
- `widget:minimize` - Widget minimized
- `widget:maximize` - Widget maximized
- `widget:message` - New message received
- `widget:typing` - Typing indicator changed
- `widget:error` - Error occurred
- `widget:status-change` - Connection status changed
- `widget:resize` - Widget dimensions changed

## Security

### Content Security Policy (CSP)

If your site uses CSP, add these directives:

```
script-src 'self' https://cdn.tekassist.com;
connect-src 'self' https://api.tekassist.com;
frame-src 'self' https://widget.tekassist.com;
style-src 'self' 'unsafe-inline';
```

### Cross-Origin Configuration

For iframe integration, ensure your server allows the widget origin:

```
X-Frame-Options: ALLOW-FROM https://widget.tekassist.com
Content-Security-Policy: frame-ancestors 'self' https://widget.tekassist.com;
```

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 70+

## Performance

- **Bundle size**: ~45KB gzipped (including React)
- **Initial load**: <200ms on 3G
- **Memory usage**: <10MB typical
- **CPU usage**: <1% idle, <5% active

## Troubleshooting

### Common Issues

1. **Widget not loading**
   - Check console for errors
   - Verify tenantId and apiUrl
   - Check network connectivity

2. **Styling conflicts**
   - Widget uses scoped CSS with `tw-` prefix
   - All styles are contained within `#tekassist-widget-root`
   - Use CSS variables for customization

3. **Cross-origin issues**
   - Ensure proper CORS configuration
   - Check CSP headers
   - Verify iframe permissions

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const widget = new TekAssistWidget({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://api.tekassist.com',
  debug: true, // Enable debug logging
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://docs.tekassist.com/widget
- Issues: https://github.com/tekassist/widget/issues
- Email: support@tekassist.com
