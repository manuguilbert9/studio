'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdditionWidgetProps {
  onClose: () => void;
}

const initialPosition = { x: 200, y: 100 };

const colors = [
  'border-blue-500',  // Unités
  'border-red-500',   // Dizaines
  'border-green-500', // Centaines
  'border-slate-900', // Milliers
  'border-slate-900', // Dizaines de milliers
];

const getBorderColor = (colIndexFromRight: number) => {
    return colors[colIndexFromRight] || 'border-slate-900';
}

export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') {
      return initialPosition;
    }
    return { x: window.innerWidth / 2 - 250, y: 100 };
  });

  const [numOperands, setNumOperands] = useState(2);
  const [numCols, setNumCols] = useState(3); // Start with hundreds, tens, units

  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
        isDragging.current = true;
        offset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y,
        };
        document.body.style.cursor = 'grabbing';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      setPos({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = 'default';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  const addOperand = () => setNumOperands(c => Math.min(c + 1, 3));
  const expandCols = () => setNumCols(c => Math.min(c + 1, 5));
  const shrinkCols = () => setNumCols(c => Math.max(c - 1, 2));

  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg flex gap-2"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center h-full cursor-grab drag-handle">
        <GripVertical className="h-6 w-6 text-slate-400" />
      </div>

      <div className="flex flex-col items-center">
        {/* Main Calculation Grid */}
        <div className="flex flex-col">

            {/* Carry Row */}
            <div className="flex flex-row-reverse justify-end ml-auto">
                 {/* This div is for the result's leftmost cell */}
                <div className="w-12 h-10 m-1" />
                {[...Array(numCols - 1)].map((_, i) => (
                    <div key={i} className="flex justify-center w-12 h-10 m-1">
                        <CarryCell borderColor={getBorderColor(i + 1)} />
                    </div>
                ))}
            </div>

            {/* Operand Rows */}
            <div className="flex flex-col-reverse">
                {[...Array(numOperands)].map((_, rowIndex) => (
                    <div key={rowIndex} className="flex items-center flex-row-reverse">
                         {rowIndex === numOperands - 2 && (
                             <div className="flex items-center justify-center w-8 h-12 text-slate-500 text-3xl font-light">+</div>
                         )}
                         {rowIndex < numOperands - 2 && <div className="w-8 h-12" />}

                        {[...Array(numCols)].map((_, colIndex) => (
                           <div key={colIndex} className="flex justify-center m-1">
                                <CalcCell borderColor={getBorderColor(colIndex)} />
                           </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Result Bar */}
            <div className="h-0.5 bg-slate-800 my-1 self-end" style={{width: `calc(${numCols * 3.5}rem)`}}/>

            {/* Result Row */}
            <div className="flex flex-row-reverse ml-auto">
                {[...Array(numCols + 1)].map((_, i) => (
                    <div key={i} className="flex justify-center m-1">
                       <CalcCell borderColor={getBorderColor(i)} />
                    </div>
                ))}
            </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="w-full flex justify-end pr-14 mt-1">
            {numOperands < 3 && (
                <Button onClick={addOperand} size="sm" variant="ghost" className="text-slate-500 hover:text-slate-800 h-8">
                    <Plus className="w-4 h-4" />
                </Button>
            )}
        </div>
         <div className="flex items-center justify-center w-full mt-2">
            <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2}>
                <ChevronLeft/>
            </Button>
            <div className="flex-grow"></div>
            <Button onClick={expandCols} size="icon" variant="ghost" disabled={numCols >= 5}>
                <ChevronRight/>
            </Button>
        </div>
      </div>


      <button onClick={onClose} className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800">
        <X className="h-5 w-5" />
      </button>
    </Card>
  );
}