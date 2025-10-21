'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GlassInput } from '@/components/ui/glass-input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { api } from '@/lib/api/api-client';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  enableNotifications: boolean;
  darkMode: boolean;
  enableAnalytics: boolean;
}

interface ApiSettings {
  apiKey: string;
  maxTokens: string;
  temperature: string;
  enableRateLimiting: boolean;
  rateLimitPerMinute: string;
}

export default function SettingsPanel() {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: '',
    siteDescription: '',
    enableNotifications: true,
    darkMode: true,
    enableAnalytics: true,
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: '',
    maxTokens: '2048',
    temperature: '0.7',
    enableRateLimiting: true,
    rateLimitPerMinute: '60',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [generalData, apiData] = await Promise.all([
        api.get<GeneralSettings>('/settings/general'),
        api.get<ApiSettings>('/settings/api'),
      ]);
      setGeneralSettings(generalData);
      setApiSettings(apiData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleGeneralChange = (key: string, value: string | boolean) => {
    setGeneralSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApiChange = (key: string, value: string | boolean) => {
    setApiSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveGeneralSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.put('/settings/general', generalSettings);
      setSuccess('General settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save general settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const saveApiSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.put('/settings/api', apiSettings);
      setSuccess('API settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save API settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settings...
          </div>
        </div>
        <GlassCard className="p-6 animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-white/10 rounded"></div>
            <div className="h-10 bg-white/10 rounded"></div>
            <div className="h-6 bg-white/10 rounded w-1/3"></div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </Button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3"
        >
          <Save className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{success}</p>
        </motion.div>
      )}

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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">General Settings</h3>
                <Button
                  onClick={saveGeneralSettings}
                  disabled={saving}
                  className="glass-button-effect"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="site-name" className="text-sm font-medium">
                      Site Name
                    </label>
                    <GlassInput
                      id="site-name"
                      value={generalSettings.siteName}
                      onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="site-description" className="text-sm font-medium">
                      Site Description
                    </label>
                    <GlassInput
                      id="site-description"
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
                      onCheckedChange={(checked) =>
                        handleGeneralChange('enableNotifications', checked)
                      }
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
                  <label htmlFor="api-key" className="text-sm font-medium">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <GlassInput
                      id="api-key"
                      value={apiSettings.apiKey}
                      onChange={(e) => handleApiChange('apiKey', e.target.value)}
                      className="flex-1"
                      type="password"
                    />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your API key is secret. Never share it publicly.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="max-tokens" className="text-sm font-medium">
                      Max Tokens
                    </label>
                    <GlassInput
                      id="max-tokens"
                      value={apiSettings.maxTokens}
                      onChange={(e) => handleApiChange('maxTokens', e.target.value)}
                      type="number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="temperature" className="text-sm font-medium">
                      Temperature
                    </label>
                    <GlassInput
                      id="temperature"
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
                    <label htmlFor="rate-limit" className="text-sm font-medium">
                      Rate Limit (requests per minute)
                    </label>
                    <GlassInput
                      id="rate-limit"
                      value={apiSettings.rateLimitPerMinute}
                      onChange={(e) => handleApiChange('rateLimitPerMinute', e.target.value)}
                      type="number"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={saveApiSettings}>Save Changes</Button>
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
