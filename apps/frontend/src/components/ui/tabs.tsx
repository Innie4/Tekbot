// Placeholder Tabs component
// ...removed duplicate import...

import React, { ReactNode, useState } from 'react';

export const Tabs = ({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) => {
  const [active, setActive] = useState(defaultValue);
  // Provide context to children in a real implementation
  return (
    <div className={className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { active, setActive }) : child
      )}
    </div>
  );
};

export const TabsList = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={className} style={{ display: 'flex', gap: '8px' }}>
    {children}
  </div>
);

export const TabsTrigger = ({
  value,
  children,
  active,
  setActive,
}: {
  value: string;
  children: ReactNode;
  active?: string;
  setActive?: (v: string) => void;
}) => (
  <button
    style={{
      padding: '8px 16px',
      background: active === value ? '#333' : '#eee',
      color: active === value ? '#fff' : '#000',
      border: 'none',
      borderRadius: '8px',
    }}
    onClick={() => setActive && setActive(value)}
  >
    {children}
  </button>
);

export const TabsContent = ({
  value,
  children,
  active,
}: {
  value: string;
  children: ReactNode;
  active?: string;
}) => (active === value ? <div>{children}</div> : null);
