
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CarryCellProps {
    borderColor: string;
}

export function CarryCell({ borderColor }: CarryCellProps) {
  const [value, setValue] = useState('');
  const [isCrossed, setIsCrossed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d?$/.test(val)) {
      setValue(val);
      // Uncross when value changes
      if (isCrossed) {
        setIsCrossed(false);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (value) { // Only allow crossing out if there is a value
      setIsCrossed(prev => !prev);
    }
  };

  return (
    <div className="relative flex items-center justify-center w-12 h-10">
       <input
        type="text"
        maxLength={1}
        value={value}
        onChange={handleChange}
        onContextMenu={handleRightClick}
        className={cn(
            'w-8 h-8 border-2 text-center text-lg font-bold font-mono bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500',
            borderColor
        )}
        />
        {isCrossed && value && (
            <span className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"></span>
        )}
    </div>
  );
}
