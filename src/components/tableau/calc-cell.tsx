'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  borderColor: string;
  size: number;
  fontSize: number;
  allowCrossing?: boolean;
  isMinuend?: boolean;
  tabIndex?: number;
}

export function CalcCell({ borderColor, size, fontSize, allowCrossing = false, isMinuend = false, tabIndex }: CalcCellProps) {
  const [value, setValue] = useState('');
  const [crossedValue, setCrossedValue] = useState<string | null>(null);
  const [hasBorrowedOne, setHasBorrowedOne] = useState(false); // New state for the small '1'

  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    // Allow only single digits
    if (/^\d?$/.test(rawInput)) {
      setValue(rawInput);
      setCrossedValue(null); // Clear crossing when value changes
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowCrossing || !value) return;
    e.preventDefault();
    if (!crossedValue) {
        setCrossedValue(value);
        setValue(''); // Clear the main value to type the new one
    } else {
        // Reset
        setValue(crossedValue);
        setCrossedValue(null);
    }
  };
  
  // This is a simplified example. A real implementation would need to coordinate state with parent.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'b' && value) { // "b" for "borrow"
          e.preventDefault();
          setHasBorrowedOne(prev => !prev);
      }
  }


  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onContextMenu={handleRightClick}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor,
        )}
        style={{
          fontSize: `${fontSize}px`,
          color: hasBorrowedOne ? 'transparent' : 'inherit' // Hide the number if '1' is shown
        }}
      />
      {/* Borrowed '1' display */}
      {hasBorrowedOne && (
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
              {value}
            </span>
        </div>
      )}

      {/* Crossed value display */}
      {crossedValue && (
         <>
            <span 
                className="absolute text-slate-500 font-bold font-mono pointer-events-none"
                style={{ fontSize: `${fontSize}px` }}
            >
                {crossedValue}
            </span>
            <span 
                className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"
            ></span>
         </>
      )}
    </div>
  );
}
