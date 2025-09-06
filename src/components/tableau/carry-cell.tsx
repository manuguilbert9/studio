

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CarryCellProps {
    id: string;
    borderColor: string;
    size: number;
    fontSize: number;
    borderStyle?: 'solid' | 'dotted';
    tabIndex?: number;
    value?: string;
    onValueChange?: (id: string, value: string) => void;
    isReadOnly?: boolean;
}

export function CarryCell({ 
    id, 
    borderColor, 
    size, 
    fontSize, 
    borderStyle = 'solid', 
    tabIndex,
    value: propValue,
    onValueChange,
    isReadOnly = false,
}: CarryCellProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isCrossed, setIsCrossed] = useState(false);
  
  const value = onValueChange ? propValue || '' : internalValue;
  const setValue = onValueChange ? (val: string) => onValueChange(id, val) : setInternalValue;

  useEffect(() => {
    if (propValue !== undefined) {
      setInternalValue(propValue);
    }
  }, [propValue]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const val = e.target.value;
     // Allow up to two digits, to handle "1" for borrowing
    if (/^\d{0,2}$/.test(val)) {
      setValue(val);
       if (isCrossed) {
        setIsCrossed(false);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    e.preventDefault();
    if (value) {
      setIsCrossed(prev => !prev);
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
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={value}
        tabIndex={tabIndex}
        onChange={handleChange}
        readOnly={isReadOnly}
        className={cn(
            'border text-center font-bold font-mono bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 w-full h-full p-0',
            borderColor,
            borderStyle === 'dotted' && 'border-dotted',
            hasBorrowedOne && 'text-transparent caret-transparent',
        )}
        style={{
            fontSize: `${fontSize}px`
        }}
        />
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
        {isCrossed && value && (
            <span className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-700 transform -translate-y-1/2 rotate-[-20deg] pointer-events-none"></span>
        )}
    </div>
  );
}
