

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
  
  const value = onValueChange ? propValue || '' : internalValue;
  const setValue = onValueChange ? (val: string) => onValueChange(id, val) : setInternalValue;

  useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue);
    }
  }, [propValue]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const rawInput = e.target.value;
    // Allow up to two digits, to handle "1" for borrowing
    if (/^\d{0,2}$/.test(rawInput)) {
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
        readOnly={isReadOnly}
        className={cn(
          'border-2 text-center font-bold font-mono bg-transparent rounded-md focus:outline-none focus:bg-slate-100 w-full h-full p-0',
          borderColor,
          // Hide the raw text input if we are using the special borrowed one display
          hasBorrowedOne && 'text-transparent',
          isReadOnly && "cursor-default ring-0 focus-visible:ring-0 focus:ring-0 focus:ring-offset-0 border-gray-300"
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
              {displayValue}
            </span>
        </div>
      ) : (
        <span 
            className="absolute font-bold font-mono pointer-events-none"
            style={{ fontSize: `${fontSize}px` }}
        >
            {value}
        </span>
      )}


      {/* Crossed value display */}
      {isCrossed && (
         <>
            <span 
                className="absolute text-slate-500 font-bold font-mono pointer-events-none"
                style={{ fontSize: `${fontSize}px` }}
            >
                {hasBorrowedOne ? displayValue : value}
            </span>
            <span 
                className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"
            ></span>
         </>
      )}
    </div>
  );
}
