
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  id: string;
  borderColor: string;
  size: number;
  fontSize: number;
  allowCrossing?: boolean;
  onFilled?: () => void;
  isMinuend?: boolean; // New prop to identify cells in the minuend row
}

export function CalcCell({ id, borderColor, size, fontSize, allowCrossing = false, onFilled, isMinuend = false }: CalcCellProps) {
  const [value, setValue] = useState('');
  const [isCrossed, setIsCrossed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const maxLength = isMinuend ? 2 : 1;
    
    if (new RegExp(`^\\d{0,${maxLength}}$`).test(val)) {
      setValue(val);
      if (isCrossed) {
        setIsCrossed(false);
      }
      if (val.length === 1 && !isMinuend && onFilled) {
        onFilled();
      }
      if (val.length === 2 && isMinuend && onFilled) {
          onFilled();
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
  
  const showSmallOne = isMinuend && value.length === 2 && value.startsWith('1');

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onContextMenu={handleRightClick}
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={isMinuend ? 2 : 1}
        value={value}
        onChange={handleChange}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor,
          showSmallOne && 'text-transparent' // Hide the input text when rendering custom
        )}
        style={{
          fontSize: `${fontSize}px`,
        }}
      />
      {showSmallOne && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-bold font-mono" style={{ color: 'hsl(var(--foreground))', transform: 'translate(-50%, -50%)', position: 'absolute', top: '40%', left: '40%' }}>1</span>
            <span style={{ fontSize: `${fontSize}px`, color: 'hsl(var(--foreground))' }} className="font-bold font-mono">{value.charAt(1)}</span>
        </div>
      )}
      {isCrossed && value && (
         <span className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"></span>
      )}
    </div>
  );
}
