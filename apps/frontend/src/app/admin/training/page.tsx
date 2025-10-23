import DashboardLayout from '@/components/admin/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

export default function TrainingDataPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Training Data</h2>
        <p className="text-sm text-muted-foreground">
          Upload and manage content used to train your chatbots.
        </p>
        <GlassCard className="p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="training-file" className="block text-sm mb-1">
                Upload a document
              </label>
              <input
                id="training-file"
                type="file"
                className="w-full rounded-lg border border-border bg-background p-2"
              />
            </div>
            <div className="flex justify-end">
              <Button>
                <UploadCloud className="h-4 w-4 mr-2" /> Upload
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
