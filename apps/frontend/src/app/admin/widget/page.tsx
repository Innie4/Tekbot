'use client';

import DashboardLayout from '@/components/admin/dashboard-layout';
import WidgetConfigurator from '@/components/admin/widget-configurator';
import { GlassCard } from '@/components/ui/glass-card';
import { motion } from 'framer-motion';

export default function AdminWidgetPage() {
  const apiUrl = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api').replace(/\/$/, '')}/v${process.env.NEXT_PUBLIC_API_VERSION || '1'}/widget`;
  const handleConfigSave = (config: unknown) => {
    console.warn('Widget configuration saved:', config);
    // Here you would typically save to your backend
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
              Widget Configuration
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize your chat widget appearance, behavior, and embed settings
            </p>
          </div>
        </div>

        <GlassCard className="p-6">
          <WidgetConfigurator
            tenantId="default-tenant"
            apiUrl={apiUrl}
            onConfigSave={handleConfigSave}
          />
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
}
