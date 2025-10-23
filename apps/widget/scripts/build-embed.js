const fs = require('fs');
const path = require('path');

const buildEmbed = () => {
  const embedTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TekAssist Widget</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: transparent;
            overflow: hidden;
        }
        
        #tekassist-widget-root {
            height: 100vh;
            width: 100vw;
            position: relative;
            --tekassist-z-index: 1;
        }
        
        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #ffffff;
            border-radius: 12px;
        }
        
        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-container {
            display: none;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #ffffff;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .error-message {
            color: #ef4444;
            font-size: 14px;
            margin-bottom: 12px;
        }
        
        .retry-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .retry-button:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div id="tekassist-widget-root">
        <div id="loading" class="loading-container">
            <div class="loading-spinner"></div>
        </div>
        <div id="error" class="error-container">
            <div class="error-message">Failed to load widget</div>
            <button class="retry-button" onclick="retryLoad()">Retry</button>
        </div>
    </div>

    <script>
        (function() {
            // Parse URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const config = {
                tenantId: urlParams.get('tenantId'),
                apiUrl: urlParams.get('apiUrl'),
                position: urlParams.get('position') || 'bottom-right',
                theme: urlParams.get('theme') || 'light',
                size: urlParams.get('size') || 'medium',
                autoOpen: urlParams.get('autoOpen') === 'true',
                sound: urlParams.get('sound') !== 'false',
                typing: urlParams.get('typing') !== 'false',
                fileUpload: urlParams.get('fileUpload') === 'true',
                emoji: urlParams.get('emoji') !== 'false'
            };

            // Validate required parameters
            if (!config.tenantId || !config.apiUrl) {
                showError('Missing required parameters: tenantId and apiUrl');
                return;
            }

            // Cross-origin messaging setup
            let parentOrigin = '*';
            if (document.referrer) {
                try {
                    parentOrigin = new URL(document.referrer).origin;
                } catch (e) {
                    console.warn('Could not determine parent origin:', e);
                }
            }

            // Message handler for parent communication
            const messageHandlers = {
                'widget:config': (data) => {
                    if (window.TekAssistWidget && window.TekAssistWidget.updateConfig) {
                        window.TekAssistWidget.updateConfig(data.config);
                    }
                },
                'widget:message': (data) => {
                    if (window.TekAssistWidget && window.TekAssistWidget.sendMessage) {
                        window.TekAssistWidget.sendMessage(data.message);
                    }
                },
                'widget:open': () => {
                    if (window.TekAssistWidget && window.TekAssistWidget.open) {
                        window.TekAssistWidget.open();
                    }
                },
                'widget:close': () => {
                    if (window.TekAssistWidget && window.TekAssistWidget.close) {
                        window.TekAssistWidget.close();
                    }
                },
                'widget:reset': () => {
                    if (window.TekAssistWidget && window.TekAssistWidget.reset) {
                        window.TekAssistWidget.reset();
                    }
                }
            };

            // Listen for messages from parent
            window.addEventListener('message', (event) => {
                if (event.origin !== parentOrigin && parentOrigin !== '*') {
                    return;
                }

                const { type, data } = event.data;
                if (messageHandlers[type]) {
                    messageHandlers[type](data);
                }
            });

            // Send message to parent
            function sendToParent(type, data) {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type, data }, parentOrigin);
                }
            }

            // Widget callbacks
            const widgetCallbacks = {
                onMessage: (message) => {
                    sendToParent('widget:message', { message });
                },
                onResize: (dimensions) => {
                    sendToParent('widget:resize', { dimensions });
                },
                onError: (error) => {
                    sendToParent('widget:error', { error });
                    showError(error.message || 'Widget error occurred');
                },
                onReady: () => {
                    sendToParent('widget:ready', {});
                    hideLoading();
                },
                onOpen: () => {
                    sendToParent('widget:opened', {});
                },
                onClose: () => {
                    sendToParent('widget:closed', {});
                }
            };

            // Error handling
            function showError(message) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'flex';
                document.querySelector('.error-message').textContent = message;
            }

            function hideLoading() {
                document.getElementById('loading').style.display = 'none';
            }

            function retryLoad() {
                document.getElementById('error').style.display = 'none';
                document.getElementById('loading').style.display = 'flex';
                loadWidget();
            }

            // Widget loading
            function loadWidget() {
                // Load React if not already loaded
                if (typeof React === 'undefined') {
                    const reactScript = document.createElement('script');
                    reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
                    reactScript.onload = () => {
                        const reactDOMScript = document.createElement('script');
                        reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
                        reactDOMScript.onload = loadWidgetBundle;
                        reactDOMScript.onerror = () => showError('Failed to load React DOM');
                        document.head.appendChild(reactDOMScript);
                    };
                    reactScript.onerror = () => showError('Failed to load React');
                    document.head.appendChild(reactScript);
                } else {
                    loadWidgetBundle();
                }
            }

            function loadWidgetBundle() {
                const widgetScript = document.createElement('script');
                const baseUrl = window.location.origin;
                widgetScript.src = baseUrl + '/widget/widget.umd.js';
                
                widgetScript.onload = () => {
                    if (typeof TekAssistWidget !== 'undefined') {
                        try {
                            window.TekAssistWidget = new TekAssistWidget({
                                ...config,
                                container: '#tekassist-widget-root',
                                callbacks: widgetCallbacks
                            });
                            
                            // Initialize widget
                            window.TekAssistWidget.init();
                        } catch (error) {
                            console.error('Widget initialization error:', error);
                            showError('Failed to initialize widget');
                        }
                    } else {
                        showError('Widget bundle loaded but TekAssistWidget not found');
                    }
                };
                
                widgetScript.onerror = () => {
                    showError('Failed to load widget bundle');
                };
                
                document.head.appendChild(widgetScript);
            }

            // Global retry function
            window.retryLoad = retryLoad;

            // Start loading
            loadWidget();

            // Notify parent that iframe is ready
            sendToParent('iframe:ready', { config });
        })();
    </script>
</body>
</html>`;

  // Ensure dist directory exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Write embed.html to dist directory
  const embedPath = path.join(distDir, 'embed.html');
  fs.writeFileSync(embedPath, embedTemplate);

  // Also copy to public directory for development
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const publicEmbedPath = path.join(publicDir, 'embed.html');
  fs.writeFileSync(publicEmbedPath, embedTemplate);

  console.log('✅ embed.html generated successfully');
  console.log(`   - ${embedPath}`);
  console.log(`   - ${publicEmbedPath}`);
};

// Run if called directly
if (require.main === module) {
  buildEmbed();
}

module.exports = buildEmbed;
