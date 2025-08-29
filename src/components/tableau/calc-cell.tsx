
'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  id: string;
  borderColor: string;
  size: number;
  fontSize: number;
  allowCrossing?: boolean;
  onFilled?: (value: string) => void;
  isMinuend?: boolean;
  tabIndex?: number;
}

export function CalcCell({ id, borderColor, size, fontSize, allowCrossing = false, onFilled, isMinuend = false, tabIndex }: CalcCellProps) {
  const [value, setValue] = useState('');
  const [isCrossed, setIsCrossed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const previousValue = value;
    const rawInput = e.target.value;
    const maxLength = isMinuend ? 2 : 1;
    
    // Allow only digits up to maxLength
    if (new RegExp(`^\\d{0,${maxLength}}$`).test(rawInput)) {
        const newValue = rawInput;
        setValue(newValue);

        if (isCrossed) {
            setIsCrossed(false);
        }

        if (onFilled) {
            // When does the cell count as "filled" for auto-tabbing?
            // 1. If it's a normal cell and length becomes 1.
            const isNormalCellFilled = !isMinuend && newValue.length === 1 && previousValue.length === 0;
            // 2. If it's a minuend cell, and...
            const isMinuendFilled = isMinuend && 
                // ...it's a single digit entry (e.g. typing '5')
                (newValue.length === 1 && previousValue.length === 0) || 
                // ...it's a two-digit entry (e.g. typing '2' after '1' to make '12')
                (newValue.length === 2 && previousValue.length === 1);

            if (isNormalCellFilled || isMinuendFilled) {
                onFilled(newValue);
            }
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
  
  // Show special styling for minuend borrow case (e.g., '12' becomes a small 1 and a big 2)
  const showSmallOne = isMinuend && value.length === 2 && value.startsWith('1');

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onContextMenu={handleRightClick}
    >
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={isMinuend ? 2 : 1}
        value={value}
        onChange={handleChange}
        tabIndex={tabIndex}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor,
          showSmallOne && 'text-transparent' // Hide the raw '12' text
        )}
        style={{
          fontSize: `${fontSize}px`,
        }}
      />
      {showSmallOne && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: 'hsl(var(--foreground))' }}>
            <span 
              className="absolute font-bold font-mono"
              style={{
                  fontSize: `${fontSize * 0.6}px`,
                  top: '10%',
                  left: '15%'
              }}
            >
              1
            </span>
            <span 
              className="font-bold font-mono"
              style={{ fontSize: `${fontSize}px` }}
            >
              {value.charAt(1)}
            </span>
        </div>
      )}
      {isCrossed && value && (
         <span className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"></span>
      )}
    </div>
  );
}
