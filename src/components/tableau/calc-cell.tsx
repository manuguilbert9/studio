
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
        'w-16 h-16 border-4 text-center text-4xl font-bold font-mono bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500',
        borderColor
      )}
    />
  );
}
