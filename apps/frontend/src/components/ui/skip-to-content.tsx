import React from 'react';
import { cn } from '@/lib/utils';

interface SkipToContentProps {
  targetId?: string;
  className?: string;
}

export function SkipToContent({
  targetId = 'main-content',
  className
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      data-skip-link
      className={cn(
        // Hidden by default, visible on focus
        'absolute left-4 top-4 z-50',
        'bg-primary text-primary-foreground',
        'px-4 py-2 rounded-md',
        'font-medium text-sm',
        'transform -translate-y-full',
        'focus:translate-y-0',
        'transition-transform duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = document.getElementById(targetId);
          if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }}
    >
      Skip to main content
    </a>
  );
}
