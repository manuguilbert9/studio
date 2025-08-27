'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { Button } from '@/components/ui/button';

interface AdditionWidgetProps {
  onClose: () => void;
}

const initialPosition = { x: 200, y: 100 };

const colors = [
  'border-blue-500',  // Unités
  'border-red-500',   // Dizaines
  'border-green-500', // Centaines
  'border-slate-900', // Milliers
];

const getBorderColor = (colIndexFromRight: number) => {
    return colors[colIndexFromRight] || 'border-slate-900';
}

export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') {
      return initialPosition;
    }
    return { x: window.innerWidth / 2 - 200, y: 100 };
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
  const expandCols = () => setNumCols(c => Math.min(c + 1, 4)); // Limit to 4 cols (thousands)
  const shrinkCols = () => setNumCols(c => Math.max(c - 1, 2));

  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg flex items-start gap-2"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseDown={handleMouseDown}
    >
        <div className="flex items-center h-full cursor-grab drag-handle pt-16">
            <GripVertical className="h-6 w-6 text-slate-400" />
        </div>

        <div className="flex flex-col items-center">
            {/* Main calculation block */}
            <div className="flex flex-row-reverse items-start">
                {/* Addition Sign Column */}
                <div className="flex flex-col items-center">
                    {/* Empty spaces to align with other columns */}
                    <div className="h-10 mb-1"></div> {/* Align with carry */}
                    <div className="h-12"></div> {/* Align with first operand */}
                    <div className="h-12 flex items-center">
                        {numOperands > 1 && <span className="text-slate-500 text-3xl font-light ml-2">+</span>}
                    </div>
                     <div className="h-12"></div>
                     <div className="h-12"></div>
                </div>

                {/* Calculation Columns */}
                {[...Array(numCols)].map((_, colIndex) => {
                     const borderColor = getBorderColor(colIndex);
                     return (
                        <div key={colIndex} className="flex flex-col items-center m-1">
                            {/* Carry cell (not for units) */}
                            <div className="w-12 h-10 mb-1 flex items-center justify-center">
                               {colIndex > 0 && <CarryCell borderColor={borderColor} />}
                            </div>

                            {/* Operand cells */}
                            {[...Array(numOperands)].map((_, rowIndex) => (
                               <div key={rowIndex} className="flex items-center h-12">
                                    <CalcCell borderColor={borderColor} />
                               </div>
                            ))}
                            
                            {/* Result Bar */}
                            <div className="h-0.5 bg-slate-800 my-1 w-12"/>

                            {/* Result cell */}
                            <div className="h-12">
                                <CalcCell borderColor={borderColor} />
                            </div>
                        </div>
                     );
                })}
                 
                 {/* Result cell for final carry-over */}
                 <div className="flex flex-col items-center m-1">
                      <div className="w-12 h-10 mb-1"/>
                       {[...Array(numOperands)].map((_, rowIndex) => <div key={rowIndex} className="w-12 h-12"/>)}
                      <div className="h-0.5 bg-slate-800 my-1 w-12"/>
                       <div className="h-12">
                           <CalcCell borderColor={getBorderColor(numCols)} />
                       </div>
                 </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center w-full mt-2 px-4">
                <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2}>
                    <ChevronLeft/>
                </Button>
                
                {numOperands < 3 && (
                    <Button onClick={addOperand} size="sm" variant="ghost" className="text-slate-500 hover:text-slate-800">
                        <Plus className="w-4 h-4 mr-1" /> Ajouter nombre
                    </Button>
                )}

                <Button onClick={expandCols} size="icon" variant="ghost" disabled={numCols >= 4}>
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
