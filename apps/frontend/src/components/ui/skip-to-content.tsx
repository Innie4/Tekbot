'use client';

import { cn } from '@/lib/utils';

export function SkipToContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href="#main-content"
      id="skip-to-content"
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:bg-background focus:text-foreground focus:p-4 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-electric-blue',
        className
      )}
      {...props}
    >
      Skip to content
    </a>
  );
}