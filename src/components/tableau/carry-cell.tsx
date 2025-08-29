
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CarryCellProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    borderColor: string;
    size: number;
    fontSize: number;
    borderStyle?: 'solid' | 'dotted';
}

export function CarryCell({ id, value, onChange, borderColor, size, fontSize, borderStyle = 'solid' }: CarryCellProps) {
  const [isCrossed, setIsCrossed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d?$/.test(val)) {
      onChange(val);
      if (isCrossed) {
        setIsCrossed(false);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
        id={id}
        type="text"
        maxLength={1}
        value={value}
        onChange={handleChange}
        className={cn(
            'border text-center font-bold font-mono bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500',
            borderColor,
            borderStyle === 'dotted' && 'border-dotted'
        )}
        style={{
            width: `${size}px`,
            height: `${size}px`,
            fontSize: `${fontSize}px`
        }}
        />
        {isCrossed && value && (
            <span className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"></span>
        )}
    </div>
  );
}
