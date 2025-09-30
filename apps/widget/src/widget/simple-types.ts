// Simplified types for widget components to avoid conflicts

export interface WidgetTheme {
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
}

export interface WidgetBranding {
  logo?: string;
  companyName?: string;
  showPoweredBy?: boolean;
}

export interface WidgetBehavior {
  autoOpen?: boolean;
  autoOpenDelay?: number;
  enableSound?: boolean;
  enableTypingIndicator?: boolean;
  maxHeight?: string;
  maxWidth?: string;
}

export interface WidgetConfig {
  tenantId: string;
  apiUrl: string;
  title?: string;
  welcomeMessage?: string;
  placeholder?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: WidgetTheme;
  branding?: WidgetBranding;
  behavior?: WidgetBehavior;
  sessionId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  onMessage?: (message: ChatMessage) => void;
  onStateChange?: (state: WidgetState) => void;
  onError?: (error: Error) => void;
  onResize?: (dimensions: WidgetDimensions) => void;
}

export interface ChatMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  metadata?: {
    type?: string;
    source?: string;
    sessionId?: string;
    conversationId?: string;
    customerId?: string;
    error?: string;
    [key: string]: any;
  };
}

export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  conversationId: string | null;
  sessionId: string | null;
  messages: ChatMessage[];
  unreadCount: number;
}

export interface WidgetDimensions {
  width: number;
  height: number;
}

export interface WidgetCallbacks {
  onMessage?: (message: ChatMessage) => void;
  onStateChange?: (state: WidgetState) => void;
  onError?: (error: Error) => void;
  onResize?: (dimensions: WidgetDimensions) => void;
}

export interface WidgetProps {
  container: HTMLElement;
  tenantId: string;
  apiUrl: string;
  sessionId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  onMessage?: (message: ChatMessage) => void;
  onStateChange?: (state: WidgetState) => void;
  onError?: (error: Error) => void;
  onResize?: (dimensions: WidgetDimensions) => void;
}

// Widget event types
export type WidgetEventType = 
  | 'WIDGET_READY'
  | 'WIDGET_OPEN'
  | 'WIDGET_CLOSE'
  | 'WIDGET_MINIMIZE'
  | 'WIDGET_MAXIMIZE'
  | 'WIDGET_MESSAGE'
  | 'WIDGET_ERROR'
  | 'WIDGET_RESIZE'
  | 'WIDGET_STATE_CHANGE';

export interface WidgetEvent {
  type: WidgetEventType;
  data?: any;
  timestamp: Date;
}