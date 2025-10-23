import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassCardVariants = cva('rounded-lg transition-all duration-300 ease-out', {
  variants: {
    variant: {
      default: 'glass-card-effect',
      dark: 'glass-dark',
      solid: 'bg-tech border border-border',
    },
    size: {
      default: 'p-6',
      sm: 'p-4',
      lg: 'p-8',
    },
    hover: {
      default: 'hover-scale',
      none: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    hover: 'default',
  },
});

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, size, hover, ...props }, ref) => {
    return (
      <div
        className={cn(glassCardVariants({ variant, size, hover, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassCard.displayName = 'GlassCard';

export { GlassCard, glassCardVariants };
