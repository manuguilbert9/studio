'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  borderColor: string;
  size: number;
  fontSize: number;
}

export function CalcCell({ borderColor, size, fontSize }: CalcCellProps) {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only single digits
    if (/^\d?$/.test(val)) {
      setValue(val);
    }
  };

  return (
    <input
      type="text"
      maxLength={1}
      value={value}
      onChange={handleChange}
      className={cn(
        'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100',
        borderColor
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
      }}
    />
  );
}
