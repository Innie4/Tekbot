import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container mx-auto p-6">
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground mt-2">The requested page does not exist.</p>
        <div className="mt-4">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
