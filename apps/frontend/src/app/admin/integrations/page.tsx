import DashboardLayout from '@/components/admin/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function IntegrationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect TekAssist to your tools and platforms.
        </p>
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Slack</p>
              <p className="text-xs text-muted-foreground">
                Send conversations and alerts to Slack channels
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Webhook</p>
              <p className="text-xs text-muted-foreground">
                Push events to your backend via webhooks
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
