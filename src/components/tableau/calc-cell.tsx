

'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CalcCellProps {
  id: string;
  borderColor: string;
  size: number;
  fontSize: number;
  allowCrossing?: boolean;
  isMinuend?: boolean;
  tabIndex?: number;
  isReadOnly?: boolean;
  value?: string;
  onValueChange?: (id: string, value: string) => void;
}

export function CalcCell({ 
    id, 
    borderColor, 
    size, 
    fontSize, 
    allowCrossing = false, 
    isMinuend = false, 
    tabIndex, 
    isReadOnly = false, 
    value: propValue,
    onValueChange
}: CalcCellProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isCrossed, setIsCrossed] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use propValue if in controlled mode (exercise), otherwise use internal state (tableau)
  const value = onValueChange !== undefined ? propValue || '' : internalValue;
  const setValue = onValueChange || setInternalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const rawInput = e.target.value;
    // Allow up to two digits for minuend (for borrowing), one for others.
    const maxLength = isMinuend ? 2 : 1;
    if (/^\d*$/.test(rawInput) && rawInput.length <= maxLength) {
      setValue(rawInput);
      if (isCrossed) {
        setIsCrossed(false);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || !allowCrossing || !value) return;
    e.preventDefault();
    setIsCrossed(prev => !prev);
  };
  
  // Logic to display number with borrowed '1'
  const hasBorrowedOne = isMinuend && value.length === 2 && value.startsWith('1');
  
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
        maxLength={isMinuend ? 2 : 1}
        value={value}
        onChange={handleChange}
        tabIndex={tabIndex}
        readOnly={isReadOnly}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor,
          // Hide the raw text input if we are using the special borrowed one display
          hasBorrowedOne && 'text-transparent caret-transparent',
          isReadOnly && "cursor-default ring-0 focus-visible:ring-0 focus:ring-0 focus:ring-offset-0 border-gray-300 bg-slate-50/50"
        )}
        style={{
          fontSize: `${fontSize}px`,
        }}
      />
      
      {/* Special display for borrowed '1' */}
      {hasBorrowedOne ? (
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
              {value.substring(1)}
            </span>
        </div>
      ) : isReadOnly ? (
        // For exercise mode, just display the prop value directly
         <span 
            className="absolute font-bold font-mono pointer-events-none"
            style={{ fontSize: `${fontSize}px` }}
        >
            {value}
        </span>
      ) : null}


      {/* Crossed value display */}
      {isCrossed && (
         <>
            <span 
                className="absolute text-slate-500 font-bold font-mono pointer-events-none"
                style={{ fontSize: `${fontSize}px` }}
            >
                {hasBorrowedOne ? value.substring(1) : value}
            </span>
            <span 
                className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"
            ></span>
         </>
      )}
    </div>
  );
}
