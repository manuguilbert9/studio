
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  borderColor: string;
  size: number;
  fontSize: number;
  allowCrossing?: boolean;
}

export function CalcCell({ borderColor, size, fontSize, allowCrossing = false }: CalcCellProps) {
  const [value, setValue] = useState('');
  const [isCrossed, setIsCrossed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only single digits
    if (/^\d?$/.test(val)) {
      setValue(val);
      if (isCrossed) {
        setIsCrossed(false); // Remove cross-out when value changes
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowCrossing) return;
    e.preventDefault();
    if (value) {
      setIsCrossed(prev => !prev);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onContextMenu={handleRightClick}
    >
      <input
        type="text"
        maxLength={1}
        value={value}
        onChange={handleChange}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor
        )}
        style={{
          fontSize: `${fontSize}px`,
        }}
      />
      {isCrossed && value && (
         <span className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"></span>
      )}
    </div>
  );
}
