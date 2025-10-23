'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Download, Code, Globe, Smartphone, Monitor, Settings } from 'lucide-react';

interface SnippetOptions {
  integration: 'script' | 'iframe' | 'npm' | 'cdn';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
  theme: 'light' | 'dark' | 'auto' | 'custom';
  size: 'small' | 'medium' | 'large' | 'custom';
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
  features: {
    autoOpen?: boolean;
    sound?: boolean;
    typing?: boolean;
    fileUpload?: boolean;
    emoji?: boolean;
  };
}

interface WidgetSnippetGeneratorProps {
  tenantId: string;
  apiUrl: string;
  widgetConfig?: any;
}

export default function WidgetSnippetGenerator({
  tenantId,
  apiUrl,
  widgetConfig,
}: WidgetSnippetGeneratorProps) {
  const [options, setOptions] = useState<SnippetOptions>({
    integration: 'script',
    position: 'bottom-right',
    theme: 'light',
    size: 'medium',
    features: {
      autoOpen: false,
      sound: true,
      typing: true,
      fileUpload: false,
      emoji: true,
    },
  });

  const [generatedCode, setGeneratedCode] = useState('');
  const [activeTab, setActiveTab] = useState('script');

  useEffect(() => {
    generateSnippet();
  }, [options, tenantId, apiUrl]);

  const generateSnippet = () => {
    let code = '';

    switch (options.integration) {
      case 'script':
        code = generateScriptSnippet();
        break;
      case 'iframe':
        code = generateIframeSnippet();
        break;
      case 'npm':
        code = generateNpmSnippet();
        break;
      case 'cdn':
        code = generateCdnSnippet();
        break;
    }

    setGeneratedCode(code);
  };

  const generateScriptSnippet = () => {
    const config = {
      tenantId,
      apiUrl,
      position: options.position,
      theme: options.theme,
      size: options.size,
      ...options.features,
      ...(options.customPosition && { customPosition: options.customPosition }),
      ...(options.customSize && { customSize: options.customSize }),
    };

    return `<!-- TekAssist Chat Widget -->
<script>
  (function() {
    // Widget configuration
    window.TekAssistConfig = ${JSON.stringify(config, null, 4)};
    
    // Load widget script
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget/embed.js';
    script.async = true;
    script.onload = function() {
      if (typeof TekAssistWidget !== 'undefined') {
        TekAssistWidget.init(window.TekAssistConfig);
      }
    };
    
    // Insert script into page
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  })();
</script>

<!-- Widget container -->
<div id="tekassist-widget-container"></div>`;
  };

  const generateIframeSnippet = () => {
    const params = new URLSearchParams({
      tenantId,
      apiUrl,
      position: options.position,
      theme: options.theme,
      size: options.size,
      autoOpen: options.features.autoOpen?.toString() || 'false',
      sound: options.features.sound?.toString() || 'true',
      typing: options.features.typing?.toString() || 'true',
    });

    return `<!-- TekAssist Chat Widget (iframe) -->
<iframe
  id="tekassist-widget-iframe"
  src="${window.location.origin}/widget/embed.html?${params.toString()}"
  style="
    position: fixed;
    ${options.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
    ${options.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
    ${options.position === 'top-right' ? 'top: 20px; right: 20px;' : ''}
    ${options.position === 'top-left' ? 'top: 20px; left: 20px;' : ''}
    width: ${options.size === 'small' ? '300px' : options.size === 'large' ? '450px' : '400px'};
    height: ${options.size === 'small' ? '400px' : options.size === 'large' ? '700px' : '600px'};
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    background: transparent;
  "
  allow="microphone; camera; geolocation"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
></iframe>`;
  };

  const generateNpmSnippet = () => {
    return `// Install TekAssist Widget
npm install @tekassist/widget

// React Component Usage
import React from 'react';
import { TekAssistWidget } from '@tekassist/widget';

function App() {
  const widgetConfig = {
    tenantId: '${tenantId}',
    apiUrl: '${apiUrl}',
    position: '${options.position}',
    theme: '${options.theme}',
    size: '${options.size}',
    features: ${JSON.stringify(options.features, null, 6)}
  };

  return (
    <div className="App">
      {/* Your app content */}
      
      <TekAssistWidget config={widgetConfig} />
    </div>
  );
}

export default App;

// Or use the hook for more control
import { useTekAssistWidget } from '@tekassist/widget';

function MyComponent() {
  const { openWidget, closeWidget, sendMessage } = useTekAssistWidget({
    tenantId: '${tenantId}',
    apiUrl: '${apiUrl}',
    // ... other config options
  });

  return (
    <div>
      <button onClick={openWidget}>Open Chat</button>
      <button onClick={closeWidget}>Close Chat</button>
      <button onClick={() => sendMessage('Hello!')}>Send Message</button>
    </div>
  );
}`;
  };

  const generateCdnSnippet = () => {
    const config = {
      tenantId,
      apiUrl,
      position: options.position,
      theme: options.theme,
      size: options.size,
      ...options.features,
    };

    return `<!-- TekAssist Widget via CDN -->
<script src="https://cdn.tekassist.com/widget/v1/tekassist-widget.min.js"></script>
<script>
  // Initialize widget when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    TekAssistWidget.init(${JSON.stringify(config, null, 4)});
  });
</script>

<!-- Optional: Custom styling -->
<style>
  .tekassist-widget {
    /* Custom widget styles */
    --tekassist-primary-color: #3B82F6;
    --tekassist-secondary-color: #EFF6FF;
    --tekassist-text-color: #1F2937;
    --tekassist-background-color: #FFFFFF;
  }
</style>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    // You could add a toast notification here
    alert('Code copied to clipboard!');
  };

  const downloadSnippet = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tekassist-widget-${options.integration}.${options.integration === 'npm' ? 'js' : 'html'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateOption = (path: string, value: any) => {
    setOptions((prev) => {
      const keys = path.split('.');
      const newOptions = { ...prev };
      let current: any = newOptions;

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
      return newOptions;
    });
  };

  const integrationTabs = [
    { id: 'script', label: 'Script Tag', icon: Code, description: 'Simple script tag integration' },
    { id: 'iframe', label: 'iFrame', icon: Globe, description: 'Embedded iframe widget' },
    { id: 'npm', label: 'NPM/React', icon: Monitor, description: 'React component package' },
    { id: 'cdn', label: 'CDN', icon: Smartphone, description: 'CDN hosted widget' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Widget Snippet Generator</h1>
        <p className="text-gray-600">
          Generate embed code for your chat widget with custom configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Integration Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {integrationTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setOptions((prev) => ({ ...prev, integration: tab.id as any }));
                        setActiveTab(tab.id);
                      }}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        options.integration === tab.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={20} className="mb-2" />
                      <div className="text-sm font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Widget Position</h3>
              <select
                value={options.position}
                onChange={(e) => updateOption('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="custom">Custom Position</option>
              </select>

              {options.position === 'custom' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Bottom (e.g., 20px)"
                    onChange={(e) => updateOption('customPosition.bottom', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Right (e.g., 20px)"
                    onChange={(e) => updateOption('customPosition.right', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Top (e.g., 20px)"
                    onChange={(e) => updateOption('customPosition.top', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Left (e.g., 20px)"
                    onChange={(e) => updateOption('customPosition.left', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Theme & Size</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                  <select
                    value={options.theme}
                    onChange={(e) => updateOption('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={options.size}
                    onChange={(e) => updateOption('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Small (300x400)</option>
                    <option value="medium">Medium (400x600)</option>
                    <option value="large">Large (450x700)</option>
                    <option value="custom">Custom Size</option>
                  </select>
                </div>

                {options.size === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Width (e.g., 400px)"
                      onChange={(e) => updateOption('customSize.width', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Height (e.g., 600px)"
                      onChange={(e) => updateOption('customSize.height', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Features</h3>
              <div className="space-y-3">
                {Object.entries(options.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => updateOption(`features.${key}`, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Code Output Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Code size={20} />
                <h3 className="text-lg font-medium">Generated Code</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {options.integration.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
                <button
                  onClick={downloadSnippet}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100 whitespace-pre-wrap">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </div>

            {/* Integration Instructions */}
            <div className="p-4 border-t bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">Integration Instructions</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {options.integration === 'script' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Copy the code above and paste it into your HTML file</li>
                    <li>Place it before the closing &lt;/body&gt; tag for best performance</li>
                    <li>The widget will automatically initialize when the page loads</li>
                    <li>Customize the configuration object to match your needs</li>
                  </ul>
                )}
                {options.integration === 'iframe' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Add the iframe code to your HTML where you want the widget to appear</li>
                    <li>The widget runs in complete isolation from your site</li>
                    <li>Adjust the style attributes to customize positioning and size</li>
                    <li>Ensure your CSP allows iframe embedding if applicable</li>
                  </ul>
                )}
                {options.integration === 'npm' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Install the package using npm or yarn</li>
                    <li>Import and use the React component in your application</li>
                    <li>Configure the widget using props or the hook API</li>
                    <li>Supports TypeScript out of the box</li>
                  </ul>
                )}
                {options.integration === 'cdn' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Include the CDN script in your HTML head section</li>
                    <li>Initialize the widget with your configuration</li>
                    <li>No build process required - works with any website</li>
                    <li>Automatically updated with latest features and fixes</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
