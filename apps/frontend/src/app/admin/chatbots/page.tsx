import DashboardLayout from '@/components/admin/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ChatbotsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Chatbots</h2>
        <p className="text-sm text-muted-foreground">Manage your assistants and configure their behavior.</p>
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm">No chatbots yet.</p>
            <p className="text-xs text-muted-foreground">Create your first assistant to start engaging users.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Chatbot
          </Button>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}