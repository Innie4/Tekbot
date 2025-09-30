// Main widget exports
export { TekAssistWidget, ChatWidgetStandalone } from './widget';

// Utility exports
export { WidgetMessaging } from './utils/widget-messaging';
export { ThemeEngine } from './utils/theme-engine';

// Type exports
export * from './types';

// Hook exports
export { useTekAssistWidget, useTekAssistWidgetState as useWidgetState, useTekAssistWidgetSimple as useSimpleWidget } from './hooks/use-tekassist-widget';

// Embed script
export { default as EmbedManager } from './embed';

// Version
export const VERSION = '1.0.0';