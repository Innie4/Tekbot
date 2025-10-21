// Widget Configuration Types
export interface WidgetConfig {
  tenantId: string;
  apiUrl: string;
  position?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | 'custom';
  theme?: 'light' | 'dark' | 'auto' | 'custom';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customPosition?: {
    bottom?: string;
    right?: string;
    top?: string;
    left?: string;
  };
  customSize?: {
    width?: string;
    height?: string;
  };
  features?: WidgetFeatures;
  branding?: WidgetBranding;
  behavior?: WidgetBehavior;
  callbacks?: WidgetCallbacks;
  container?: string | HTMLElement;
}

export interface WidgetFeatures {
  autoOpen?: boolean;
  sound?: boolean;
  typing?: boolean;
  fileUpload?: boolean;
  emoji?: boolean;
  markdown?: boolean;
  codeHighlight?: boolean;
  voiceInput?: boolean;
  screenShare?: boolean;
}

export interface WidgetBranding {
  logo?: string;
  companyName?: string;
  welcomeMessage?: string;
  placeholderText?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    family?: string;
    size?: string;
    weight?: string;
  };
}

export interface WidgetBehavior {
  autoMinimize?: boolean;
  minimizeTimeout?: number;
  persistConversation?: boolean;
  showTypingIndicator?: boolean;
  showOnlineStatus?: boolean;
  enableNotifications?: boolean;
  maxMessages?: number;
  rateLimitMessages?: number;
  rateLimitWindow?: number;
}

export interface WidgetCallbacks {
  onReady?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: WidgetError) => void;
  onResize?: (dimensions: WidgetDimensions) => void;
  onTyping?: (isTyping: boolean) => void;
  onStatusChange?: (status: WidgetStatus) => void;
}

// Theme Types
export interface WidgetTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    family: string;
    size: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
    weight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
  shadow?: string;
}

export interface AdvancedThemeConfig extends ThemeConfig {
  components?: {
    chatBubble?: ComponentTheme;
    inputField?: ComponentTheme;
    button?: ComponentTheme;
    header?: ComponentTheme;
    avatar?: ComponentTheme;
    timestamp?: ComponentTheme;
  };
  animations?: {
    enabled?: boolean;
    duration?: string;
    easing?: string;
  };
  responsive?: {
    breakpoints?: {
      mobile?: string;
      tablet?: string;
      desktop?: string;
    };
    scaling?: {
      mobile?: number;
      tablet?: number;
      desktop?: number;
    };
  };
}

export interface ComponentTheme {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  boxShadow?: string;
  hover?: Partial<ComponentTheme>;
  active?: Partial<ComponentTheme>;
  disabled?: Partial<ComponentTheme>;
}

// Message Types
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessageMetadata {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  source?: 'widget' | 'api' | 'webhook';
  context?: Record<string, any>;
  intent?: string;
  confidence?: number;
  processingTime?: number;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video' | 'link';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

// Widget Messaging Types
export interface WidgetMessage {
  type: string;
  data?: any;
  timestamp?: number;
  id?: string;
}

export interface WidgetMessageHandler {
  (message: WidgetMessage): void;
}

// Widget State Types
export interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  isTyping: boolean;
  isOnline: boolean;
  hasUnreadMessages: boolean;
  messageCount: number;
  lastActivity: Date | null;
  status: WidgetStatus;
}

export type WidgetStatus =
  | 'initializing'
  | 'ready'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'maintenance';

export interface WidgetError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface WidgetDimensions {
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ConversationConfig {
  id?: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  settings?: {
    language?: string;
    timezone?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  };
}

// Event Types
export interface WidgetEvent {
  type: string;
  payload?: any;
  timestamp: Date;
  source: 'widget' | 'user' | 'system';
}

export type WidgetEventType =
  | 'widget:ready'
  | 'widget:open'
  | 'widget:close'
  | 'widget:minimize'
  | 'widget:maximize'
  | 'widget:resize'
  | 'widget:message'
  | 'widget:typing'
  | 'widget:error'
  | 'widget:status-change'
  | 'widget:config-update'
  | 'widget:theme-change';

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Widget Instance Types
export interface WidgetInstance {
  init(): Promise<void>;
  destroy(): void;
  open(): void;
  close(): void;
  minimize(): void;
  maximize(): void;
  sendMessage(message: string): Promise<void>;
  updateConfig(config: Partial<WidgetConfig>): void;
  updateTheme(theme: Partial<ThemeConfig>): void;
  getState(): WidgetState;
  getConfig(): WidgetConfig;
  addEventListener(
    type: WidgetEventType,
    handler: (event: WidgetEvent) => void,
  ): void;
  removeEventListener(
    type: WidgetEventType,
    handler: (event: WidgetEvent) => void,
  ): void;
}
