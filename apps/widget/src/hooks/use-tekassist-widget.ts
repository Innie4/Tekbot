import { useState, useEffect, useRef, useCallback } from 'react';
import { WidgetMessageTypes } from '../utils/widget-messaging';
import { TekAssistWidget } from '../widget';
import {
  WidgetState,
  WidgetEvent,
  WidgetEventType,
  ChatMessage,
  WidgetDimensions,
  WidgetConfig,
} from '../widget/simple-types';

interface UseTekAssistWidgetOptions {
  tenantId: string;
  apiUrl: string;
  sessionId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  container?: HTMLElement;
  autoInit?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onStateChange?: (state: WidgetState) => void;
  onError?: (error: Error) => void;
  onResize?: (dimensions: WidgetDimensions) => void;
}

interface UseTekAssistWidgetReturn {
  widget: TekAssistWidget | null;
  state: WidgetState;
  isReady: boolean;
  error: Error | null;

  // Widget actions
  init: () => Promise<void>;
  destroy: () => void;
  open: () => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  sendMessage: (message: string) => Promise<void>;
  updateConfig: (config: Partial<WidgetConfig>) => void;

  // Event handlers
  addEventListener: (
    type: WidgetEventType,
    handler: (event: WidgetEvent) => void,
  ) => void;
  removeEventListener: (
    type: WidgetEventType,
    handler: (event: WidgetEvent) => void,
  ) => void;
}

const initialState: WidgetState = {
  isOpen: false,
  isMinimized: false,
  isLoading: false,
  conversationId: null,
  sessionId: null,
  messages: [],
  unreadCount: 0,
};

export function useTekAssistWidget(
  options: UseTekAssistWidgetOptions,
): UseTekAssistWidgetReturn {
  const widgetRef = useRef<TekAssistWidget | null>(null);
  const [state, setState] = useState<WidgetState>(initialState);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventHandlersRef = useRef<
    Map<WidgetEventType, Set<(event: WidgetEvent) => void>>
  >(new Map());

  // Initialize widget
  const init = useCallback(async () => {
    try {
      setError(null);
      setState(prev => ({ ...prev, isLoading: true }));

      // Clean up existing widget
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }

      // Create new widget instance
      const widget = new TekAssistWidget({
        container: options.container || document.body,
        tenantId: options.tenantId,
        apiUrl: options.apiUrl,
        ...(options.sessionId && { sessionId: options.sessionId }),
        ...(options.customerId && { customerId: options.customerId }),
        ...(options.metadata && { metadata: options.metadata }),
        ...(options.onMessage && { onMessage: options.onMessage }),
        ...(options.onStateChange && { onStateChange: options.onStateChange }),
        ...(options.onError && { onError: options.onError }),
        ...(options.onResize && { onResize: options.onResize }),
      });

      widgetRef.current = widget;
      setIsReady(true);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error('Failed to initialize widget');
      setError(err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [options]);

  // Destroy widget
  const destroy = useCallback(() => {
    if (widgetRef.current) {
      widgetRef.current.destroy();
      widgetRef.current = null;
    }
    setIsReady(false);
    setState(initialState);
    setError(null);
    eventHandlersRef.current.clear();
  }, []);

  // Widget actions
  const open = useCallback(() => {
    widgetRef.current?.open();
  }, []);

  const close = useCallback(() => {
    widgetRef.current?.close();
  }, []);

  const minimize = useCallback(() => {
    widgetRef.current?.minimize();
  }, []);

  const maximize = useCallback(() => {
    widgetRef.current?.maximize();
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (widgetRef.current) {
      await widgetRef.current.sendMessage(message);
    }
  }, []);

  const updateConfig = useCallback((config: Partial<WidgetConfig>) => {
    widgetRef.current?.updateConfig(config);
  }, []);

  // Event handling
  const addEventListener = useCallback(
    (type: WidgetEventType, handler: (event: WidgetEvent) => void) => {
      // Widget doesn't have addEventListener method, so we'll handle events through callbacks
      console.warn('addEventListener not implemented on TekAssistWidget');
    },
    [],
  );

  const removeEventListener = useCallback(
    (type: WidgetEventType, handler: (event: WidgetEvent) => void) => {
      // Widget doesn't have removeEventListener method, so we'll handle events through callbacks
      console.warn('removeEventListener not implemented on TekAssistWidget');
    },
    [],
  );

  // Auto-initialize if enabled
  useEffect(() => {
    if (options.autoInit !== false) {
      init();
    }

    return () => {
      destroy();
    };
  }, [init, destroy, options.autoInit]);

  // Update widget config when options change
  useEffect(() => {
    if (widgetRef.current && isReady) {
      const { autoInit, container, ...config } = options;
      widgetRef.current.updateConfig(config);
    }
  }, [options, isReady]);

  return {
    widget: widgetRef.current,
    state,
    isReady,
    error,
    init,
    destroy,
    open,
    close,
    minimize,
    maximize,
    sendMessage,
    updateConfig,
    addEventListener,
    removeEventListener,
  };
}

// Hook for simple widget integration
export function useTekAssistWidgetSimple(tenantId: string, apiUrl: string) {
  return useTekAssistWidget({
    tenantId,
    apiUrl,
    autoInit: true,
  });
}

// Hook for widget state only (when widget is managed externally)
export function useTekAssistWidgetState(widget: TekAssistWidget | null) {
  const [state, setState] = useState<WidgetState>(initialState);

  useEffect(() => {
    if (!widget) return;

    const handleStateChange = () => {
      setState(widget.getState());
    };

    // Listen for state changes
    const unsubscribeOpen = widget.subscribe(
      WidgetMessageTypes.OPEN,
      handleStateChange,
    );
    const unsubscribeClose = widget.subscribe(
      WidgetMessageTypes.CLOSE,
      handleStateChange,
    );
    const unsubscribeMessage = widget.subscribe(
      WidgetMessageTypes.MESSAGE,
      handleStateChange,
    );
    const unsubscribeStatusChange = widget.subscribe(
      WidgetMessageTypes.STATUS_CHANGE,
      handleStateChange,
    );

    // Initial state
    handleStateChange();

    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeMessage();
      unsubscribeStatusChange();
    };
  }, [widget]);

  return state;
}
