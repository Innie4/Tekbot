// Placeholder Switch component
import React from 'react';

export const Switch = ({
  checked = false,
  onCheckedChange,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      style={{
        padding: '8px 16px',
        borderRadius: '16px',
        background: checked ? '#333' : '#eee',
        color: checked ? '#fff' : '#000',
        border: 'none',
      }}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
    >
      {checked ? 'On' : 'Off'}
    </button>
  );
};
