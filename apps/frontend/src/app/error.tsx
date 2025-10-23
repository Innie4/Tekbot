'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto p-6">
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {error.message || 'Unexpected error occurred.'}
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => reset()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
