'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  borderColor: string;
}

export function CalcCell({ borderColor }: CalcCellProps) {
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
        'w-12 h-12 border-2 text-center text-3xl font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100',
        borderColor
      )}
    />
  );
}
