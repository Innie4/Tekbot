'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Eye, RefreshCw, Palette, Settings, Code, Monitor } from 'lucide-react';
import { api } from '@/lib/api/api-client';

interface WidgetTheme {
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

interface WidgetBranding {
  logo?: string;
  companyName?: string;
  showPoweredBy?: boolean;
}

interface WidgetBehavior {
  autoOpen?: boolean;
  autoOpenDelay?: number;
  enableSound?: boolean;
  enableTypingIndicator?: boolean;
  maxHeight?: string;
  maxWidth?: string;
}

interface WidgetConfig {
  id?: string;
  tenantId: string;
  title: string;
  welcomeMessage?: string;
  placeholder?: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: WidgetTheme;
  branding: WidgetBranding;
  behavior: WidgetBehavior;
  isActive: boolean;
  version?: string;
  customFields?: Record<string, unknown>;
}

interface WidgetConfiguratorProps {
  tenantId: string;
  apiUrl: string;
  onConfigSave?: (config: WidgetConfig) => void;
}

export default function WidgetConfigurator({
  tenantId,
  apiUrl: _apiUrl,
  onConfigSave,
}: WidgetConfiguratorProps) {
  const [config, setConfig] = useState<WidgetConfig>({
    tenantId,
    title: 'Chat Support',
    welcomeMessage: 'Hello! How can we help you today?',
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
      companyName: 'Your Company',
      showPoweredBy: true,
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 3000,
      enableSound: true,
      enableTypingIndicator: true,
      maxHeight: '600px',
      maxWidth: '400px',
    },
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  // removed unused embedCode state
  const [activeTab, setActiveTab] = useState('general');
  type EmbedTab = 'html' | 'vanilla' | 'react' | 'nextjs' | 'php' | 'python';
  const [embedTab, setEmbedTab] = useState<EmbedTab>('html');

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const existingConfig = await api.get<WidgetConfig>(
        `/widget/widget-config/tenant/${tenantId}`
      );
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      let savedConfig: WidgetConfig;
      if (config.id) {
        savedConfig = await api.put<WidgetConfig>(`/widget/widget-config/${config.id}`, config);
      } else {
        savedConfig = await api.post<WidgetConfig>(`/widget/widget-config`, config);
      }
      setConfig(savedConfig);
      onConfigSave?.(savedConfig);
      alert('Widget configuration saved successfully');
    } catch (error) {
      console.error('Failed to save widget config:', error);
      alert('Failed to save widget configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // removed obsolete generateEmbedCode function

  const getEmbedCode = (stack: EmbedTab) => {
    const baseApi = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')}`;
    const tId = tenantId;
    const html = `<!-- TekAssist Widget (HTML) -->
<div id="tekassist-widget-container"></div>
<script>
  window.TekAssistConfig = {
    tenantId: '${tId}',
    apiUrl: '${baseApi}',
  };
</script>
<script src="https://unpkg.com/@tekassist/widget@latest/dist/embed.js" defer></script>`;
    const vanilla = `<!-- Vanilla JS -->
<script src="https://unpkg.com/@tekassist/widget@latest/dist/embed.js"></script>
<script>
  window.TekAssistEmbed.init({
    tenantId: '${tId}',
    apiUrl: '${baseApi}',
  });
</script>`;
    const react = `// React (functional component)\nimport { useEffect } from 'react';\nimport { TekAssistWidget } from '@tekassist/widget';\n\nexport default function SupportWidget() {\n  useEffect(() => {\n    const container = document.getElementById('tekassist-widget');\n    const widget = new TekAssistWidget({
      container,
      tenantId: '${tId}',
      apiUrl: '${baseApi}',
    });\n    widget.init();
    return () => widget.destroy();
  }, []);
  return <div id="tekassist-widget" />;
}`;
    const nextjs = `'use client';
import { useEffect } from 'react';
import { TekAssistWidget } from '@tekassist/widget';

export default function SupportWidget() {
  useEffect(() => {
    const container = document.getElementById('tekassist-widget');
    const widget = new TekAssistWidget({
      container,
      tenantId: '${tId}',
      apiUrl: '${baseApi}',
    });
    widget.init();
    return () => widget.destroy();
  }, []);
  return <div id="tekassist-widget" />;
}`;
    const php = `<?php $tenantId = '${tId}'; $apiUrl='${baseApi}'; ?>
<div id="tekassist-widget-container"></div>
<script>
  window.TekAssistConfig = { tenantId: '<?php echo $tenantId; ?>', apiUrl: '<?php echo $apiUrl; ?>' };
</script>
<script src="https://unpkg.com/@tekassist/widget@latest/dist/embed.js" defer></script>`;
    const python = `{% set tenant_id = '${tId}' %}
{% set api_url = '${baseApi}' %}
<div id="tekassist-widget-container"></div>
<script>
  window.TekAssistConfig = { tenantId: '{{ tenant_id }}', apiUrl: '{{ api_url }}' };
</script>
<script src="https://unpkg.com/@tekassist/widget@latest/dist/embed.js" defer></script>`;
    switch (stack) {
      case 'html':
        return html;
      case 'vanilla':
        return vanilla;
      case 'react':
        return react;
      case 'nextjs':
        return nextjs;
      case 'php':
        return php;
      case 'python':
        return python;
      default:
        return html;
    }
  };

  const copyEmbedCode = () => {
    const code = getEmbedCode(embedTab);
    navigator.clipboard.writeText(code);
    alert('Embed code copied to clipboard');
  };

  const updateConfig = (path: string, value: unknown) => {
    setConfig((prev) => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current: any = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key) {
          current[key] = { ...current[key] };
          current = current[key];
        }
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey) {
        current[lastKey] = value;
      }
      return newConfig;
    });
  };

  const resetToDefaults = () => {
    setConfig((prev) => ({
      ...prev,
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
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: Monitor },
    { id: 'embed', label: 'Embed Code', icon: Code },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widget Configurator</h1>
          <p className="text-gray-800">Customize your chat widget appearance and behavior</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Eye size={16} />
            <span>{previewMode ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="widget-title"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Widget Title
                    </label>
                    <input
                      id="widget-title"
                      type="text"
                      value={config.title}
                      onChange={(e) => updateConfig('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="welcome-message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Welcome Message
                    </label>
                    <textarea
                      id="welcome-message"
                      value={config.welcomeMessage || ''}
                      onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-placeholder"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Input Placeholder
                    </label>
                    <input
                      id="input-placeholder"
                      type="text"
                      value={config.placeholder || ''}
                      onChange={(e) => updateConfig('placeholder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="widget-position"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Widget Position
                    </label>
                    <select
                      id="widget-position"
                      value={config.position}
                      onChange={(e) => updateConfig('position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="company-name"
                      className="block text-sm font-medium text-gray-800 mb-2"
                    >
                      Company Name
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={config.branding.companyName || ''}
                      onChange={(e) => updateConfig('branding.companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="widget-active" className="text-sm font-medium text-gray-800">
                        Widget Active
                      </label>
                      <p className="text-sm text-gray-800">Enable or disable the widget</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="widget-active"
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) => updateConfig('isActive', e.target.checked)}
                        className="sr-only peer"
                        aria-label="Widget Active"
                      />
                      <span className="sr-only">Widget Active</span>
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="branding-powered-by"
                        className="text-sm font-medium text-gray-800"
                      >
                        Show &quot;Powered by TekAssist&quot;
                      </label>
                      <p className="text-sm text-gray-800">Display branding in the widget</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="branding-powered-by"
                        type="checkbox"
                        checked={config.branding.showPoweredBy || false}
                        onChange={(e) => updateConfig('branding.showPoweredBy', e.target.checked)}
                        className="sr-only peer"
                        aria-label="Show Powered by TekAssist"
                      />
                      <span className="sr-only">Show Powered by TekAssist</span>
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Theme Colors</h3>
                    <button
                      onClick={resetToDefaults}
                      className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <RefreshCw size={16} />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="theme-primary-color-text"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="theme-primary-color"
                          type="color"
                          aria-label="Primary Color"
                          value={config.theme.primaryColor || '#3B82F6'}
                          onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          id="theme-primary-color-text"
                          type="text"
                          value={config.theme.primaryColor || '#3B82F6'}
                          onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="theme-secondary-color-text"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="theme-secondary-color"
                          type="color"
                          aria-label="Secondary Color"
                          value={config.theme.secondaryColor || '#EFF6FF'}
                          onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          id="theme-secondary-color-text"
                          type="text"
                          value={config.theme.secondaryColor || '#EFF6FF'}
                          onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="theme-text-color-text"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Text Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="theme-text-color"
                          type="color"
                          aria-label="Text Color"
                          value={config.theme.textColor || '#1F2937'}
                          onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          id="theme-text-color-text"
                          type="text"
                          value={config.theme.textColor || '#1F2937'}
                          onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="theme-background-color-text"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Background Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="theme-background-color"
                          type="color"
                          aria-label="Background Color"
                          value={config.theme.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateConfig('theme.backgroundColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          id="theme-background-color-text"
                          type="text"
                          value={config.theme.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateConfig('theme.backgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="theme-border-radius"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Border Radius
                      </label>
                      <input
                        id="theme-border-radius"
                        type="text"
                        value={config.theme.borderRadius || '8px'}
                        onChange={(e) => updateConfig('theme.borderRadius', e.target.value)}
                        placeholder="8px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="theme-font-size"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Font Size
                      </label>
                      <input
                        id="theme-font-size"
                        type="text"
                        value={config.theme.fontSize || '14px'}
                        onChange={(e) => updateConfig('theme.fontSize', e.target.value)}
                        placeholder="14px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="theme-font-family"
                      className="block text-sm font-medium text-gray-800 mb-2"
                    >
                      Font Family
                    </label>
                    <select
                      id="theme-font-family"
                      value={config.theme.fontFamily || 'system-ui, -apple-system, sans-serif'}
                      onChange={(e) => updateConfig('theme.fontFamily', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="system-ui, -apple-system, sans-serif">System Default</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'behavior' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="auto-open" className="text-sm font-medium text-gray-800">
                        Auto Open Widget
                      </label>
                      <p className="text-sm text-gray-800">
                        Automatically open the widget when page loads
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="auto-open"
                        type="checkbox"
                        checked={config.behavior.autoOpen || false}
                        onChange={(e) => updateConfig('behavior.autoOpen', e.target.checked)}
                        className="sr-only peer"
                        aria-label="Auto Open Widget"
                      />
                      <span className="sr-only">Auto Open Widget</span>
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {config.behavior.autoOpen && (
                    <div>
                      <label
                        htmlFor="auto-open-delay"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Auto Open Delay (ms)
                      </label>
                      <input
                        id="auto-open-delay"
                        type="number"
                        value={config.behavior.autoOpenDelay || 3000}
                        onChange={(e) =>
                          updateConfig('behavior.autoOpenDelay', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="enable-sound" className="text-sm font-medium text-gray-800">
                        Enable Sound
                      </label>
                      <p className="text-sm text-gray-800">
                        Play notification sounds for new messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="enable-sound"
                        type="checkbox"
                        checked={config.behavior.enableSound || false}
                        onChange={(e) => updateConfig('behavior.enableSound', e.target.checked)}
                        className="sr-only peer"
                        aria-label="Enable Sound"
                      />
                      <span className="sr-only">Enable Sound</span>
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="typing-indicator"
                        className="text-sm font-medium text-gray-800"
                      >
                        Typing Indicator
                      </label>
                      <p className="text-sm text-gray-800">
                        Show typing indicator when bot is responding
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="typing-indicator"
                        type="checkbox"
                        checked={config.behavior.enableTypingIndicator !== false}
                        onChange={(e) =>
                          updateConfig('behavior.enableTypingIndicator', e.target.checked)
                        }
                        className="sr-only peer"
                        aria-label="Typing Indicator"
                      />
                      <span className="sr-only">Typing Indicator</span>
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="max-height"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Max Height
                      </label>
                      <input
                        id="max-height"
                        type="text"
                        value={config.behavior.maxHeight || '600px'}
                        onChange={(e) => updateConfig('behavior.maxHeight', e.target.value)}
                        placeholder="600px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="max-width"
                        className="block text-sm font-medium text-gray-800 mb-2"
                      >
                        Max Width
                      </label>
                      <input
                        id="max-width"
                        type="text"
                        value={config.behavior.maxWidth || '400px'}
                        onChange={(e) => updateConfig('behavior.maxWidth', e.target.value)}
                        placeholder="400px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'embed' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Embed Code</h3>
                      <button
                        onClick={copyEmbedCode}
                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Copy Code
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 mb-4">
                      Choose a stack below and copy the tailored snippet.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { id: 'html', label: 'HTML' },
                        { id: 'vanilla', label: 'Vanilla JS' },
                        { id: 'react', label: 'React' },
                        { id: 'nextjs', label: 'Next.js' },
                        { id: 'php', label: 'PHP' },
                        { id: 'python', label: 'Python' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setEmbedTab(t.id as EmbedTab)}
                          className={`px-3 py-1 rounded-md border ${embedTab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                          aria-pressed={embedTab === t.id}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {getEmbedCode(embedTab)}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Installation Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Copy the embed code for your stack from above.</li>
                      <li>Paste it into your website&apos;s HTML or client page.</li>
                      <li>Replace the placeholder values (like tenantId) with your real values.</li>
                      <li>Deploy or run your app and verify the widget renders.</li>
                      <li>Test the widget to ensure it is working correctly.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {previewMode && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-medium mb-4">Live Preview</h3>
              <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] relative">
                <p className="text-sm text-gray-800 text-center">
                  Widget preview will be displayed here
                </p>
                <div className="absolute bottom-4 right-4">
                  <div
                    className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: config.theme.primaryColor || '#3B82F6',
                      color: config.theme.buttonTextColor || '#FFFFFF',
                    }}
                  >
                    💬
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
