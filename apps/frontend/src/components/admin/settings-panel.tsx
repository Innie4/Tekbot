'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GlassInput } from '@/components/ui/glass-input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function SettingsPanel() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'TekAssist Admin',
    siteDescription: 'AI-powered technical assistance platform',
    enableNotifications: true,
    darkMode: true,
    enableAnalytics: true,
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: 'sk-••••••••••••••••••••••••',
    maxTokens: '2048',
    temperature: '0.7',
    enableRateLimiting: true,
    rateLimitPerMinute: '60',
  });

  const handleGeneralChange = (key: string, value: string | boolean) => {
    setGeneralSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleApiChange = (key: string, value: string | boolean) => {
    setApiSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="glass-effect mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-6">General Settings</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Site Name</label>
                    <GlassInput
                      value={generalSettings.siteName}
                      onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Site Description</label>
                    <GlassInput
                      value={generalSettings.siteDescription}
                      onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Preferences</h4>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/10">
                    <div>
                      <p className="font-medium">Enable Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive system notifications</p>
                    </div>
                    <Switch
                      checked={generalSettings.enableNotifications}
                      onCheckedChange={(checked) => handleGeneralChange('enableNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/10">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Use dark theme</p>
                    </div>
                    <Switch
                      checked={generalSettings.darkMode}
                      onCheckedChange={(checked) => handleGeneralChange('darkMode', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/10">
                    <div>
                      <p className="font-medium">Enable Analytics</p>
                      <p className="text-sm text-muted-foreground">Collect usage data</p>
                    </div>
                    <Switch
                      checked={generalSettings.enableAnalytics}
                      onCheckedChange={(checked) => handleGeneralChange('enableAnalytics', checked)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="api">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-6">API Configuration</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex gap-2">
                    <GlassInput
                      value={apiSettings.apiKey}
                      onChange={(e) => handleApiChange('apiKey', e.target.value)}
                      className="flex-1"
                      type="password"
                    />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Your API key is secret. Never share it publicly.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Tokens</label>
                    <GlassInput
                      value={apiSettings.maxTokens}
                      onChange={(e) => handleApiChange('maxTokens', e.target.value)}
                      type="number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Temperature</label>
                    <GlassInput
                      value={apiSettings.temperature}
                      onChange={(e) => handleApiChange('temperature', e.target.value)}
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/10">
                  <div>
                    <p className="font-medium">Enable Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">Limit API requests per minute</p>
                  </div>
                  <Switch
                    checked={apiSettings.enableRateLimiting}
                    onCheckedChange={(checked) => handleApiChange('enableRateLimiting', checked)}
                  />
                </div>
                
                {apiSettings.enableRateLimiting && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rate Limit (requests per minute)</label>
                    <GlassInput
                      value={apiSettings.rateLimitPerMinute}
                      onChange={(e) => handleApiChange('rateLimitPerMinute', e.target.value)}
                      type="number"
                    />
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="appearance">
          <GlassCard className="p-6 flex items-center justify-center h-64">
            <p className="text-muted-foreground">Appearance settings coming soon</p>
          </GlassCard>
        </TabsContent>
        
        <TabsContent value="security">
          <GlassCard className="p-6 flex items-center justify-center h-64">
            <p className="text-muted-foreground">Security settings coming soon</p>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}