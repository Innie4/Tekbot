'use client';

import React, { useState, useEffect } from 'react';
import { Save, Eye, Copy, RefreshCw, Palette, Settings, Code, Monitor } from 'lucide-react';
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
  customFields?: Record<string, any>;
}

interface WidgetConfiguratorProps {
  tenantId: string;
  apiUrl: string;
  onConfigSave?: (config: WidgetConfig) => void;
}

export default function WidgetConfigurator({
  tenantId,
  apiUrl,
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
  const [embedCode, setEmbedCode] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadConfig();
  }, [tenantId]);

  useEffect(() => {
    generateEmbedCode();
  }, [config]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const existingConfig = await api.get<WidgetConfig>(`/widget/widget-config/tenant/${tenantId}`);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const generateEmbedCode = () => {
    const apiBase = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')}/v${process.env.NEXT_PUBLIC_API_VERSION || '1'}/widget`;
    const code = `<!-- TekAssist Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget/embed.js';
    script.async = true;
    script.onload = function() {
      TekAssistWidget.init({
        tenantId: '${tenantId}',
        apiUrl: '${apiBase}',
        containerId: 'tekassist-widget'
      });
    };
    document.head.appendChild(script);
  })();
</script>
<div id="tekassist-widget"></div>`;
    setEmbedCode(code);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard');
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
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
    setConfig(prev => ({
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
          <p className="text-gray-600">Customize your chat widget appearance and behavior</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Widget Title
                    </label>
                    <input
                      type="text"
                      value={config.title}
                      onChange={(e) => updateConfig('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welcome Message
                    </label>
                    <textarea
                      value={config.welcomeMessage || ''}
                      onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Input Placeholder
                    </label>
                    <input
                      type="text"
                      value={config.placeholder || ''}
                      onChange={(e) => updateConfig('placeholder', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Widget Position
                    </label>
                    <select
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={config.branding.companyName || ''}
                      onChange={(e) => updateConfig('branding.companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Widget Active</label>
                      <p className="text-sm text-gray-500">Enable or disable the widget</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) => updateConfig('isActive', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Show "Powered by TekAssist"</label>
                      <p className="text-sm text-gray-500">Display branding in the widget</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.branding.showPoweredBy || false}
                        onChange={(e) => updateConfig('branding.showPoweredBy', e.target.checked)}
                        className="sr-only peer"
                      />
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={config.theme.primaryColor || '#3B82F6'}
                          onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.theme.primaryColor || '#3B82F6'}
                          onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={config.theme.secondaryColor || '#EFF6FF'}
                          onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.theme.secondaryColor || '#EFF6FF'}
                          onChange={(e) => updateConfig('theme.secondaryColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={config.theme.textColor || '#1F2937'}
                          onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.theme.textColor || '#1F2937'}
                          onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={config.theme.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateConfig('theme.backgroundColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Radius
                      </label>
                      <input
                        type="text"
                        value={config.theme.borderRadius || '8px'}
                        onChange={(e) => updateConfig('theme.borderRadius', e.target.value)}
                        placeholder="8px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                      </label>
                      <input
                        type="text"
                        value={config.theme.fontSize || '14px'}
                        onChange={(e) => updateConfig('theme.fontSize', e.target.value)}
                        placeholder="14px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
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
                      <label className="text-sm font-medium text-gray-700">Auto Open Widget</label>
                      <p className="text-sm text-gray-500">Automatically open the widget when page loads</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.behavior.autoOpen || false}
                        onChange={(e) => updateConfig('behavior.autoOpen', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {config.behavior.autoOpen && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto Open Delay (ms)
                      </label>
                      <input
                        type="number"
                        value={config.behavior.autoOpenDelay || 3000}
                        onChange={(e) => updateConfig('behavior.autoOpenDelay', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Sound</label>
                      <p className="text-sm text-gray-500">Play notification sounds for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.behavior.enableSound || false}
                        onChange={(e) => updateConfig('behavior.enableSound', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Typing Indicator</label>
                      <p className="text-sm text-gray-500">Show typing indicator when bot is responding</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.behavior.enableTypingIndicator !== false}
                        onChange={(e) => updateConfig('behavior.enableTypingIndicator', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Height
                      </label>
                      <input
                        type="text"
                        value={config.behavior.maxHeight || '600px'}
                        onChange={(e) => updateConfig('behavior.maxHeight', e.target.value)}
                        placeholder="600px"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Width
                      </label>
                      <input
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
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Copy size={16} />
                        <span>Copy Code</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Copy and paste this code into your website's HTML to embed the chat widget.
                    </p>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {embedCode}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Installation Instructions</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Copy the embed code above</li>
                      <li>Paste it into your website's HTML, preferably before the closing &lt;/body&gt; tag</li>
                      <li>The widget will automatically load and be positioned according to your settings</li>
                      <li>Test the widget to ensure it's working correctly</li>
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
                <p className="text-sm text-gray-600 text-center">
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