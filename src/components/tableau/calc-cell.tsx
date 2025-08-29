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
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    // Allow up to two digits, to handle "1" for borrowing
    if (/^\d{0,2}$/.test(rawInput)) {
      setValue(rawInput);
      setCrossedValue(null);
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
  
  // Logic to display number with borrowed '1'
  const hasBorrowedOne = value.length === 2 && value.startsWith('1');
  const displayValue = hasBorrowedOne ? value.substring(1) : value;

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
        maxLength={2}
        value={value}
        onChange={handleChange}
        tabIndex={tabIndex}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor,
          // Hide the raw text input if we are using the special borrowed one display
          hasBorrowedOne && 'text-transparent'
        )}
        style={{
          fontSize: `${fontSize}px`,
        }}
      />
      
      {/* Special display for borrowed '1' */}
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
              {displayValue}
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
