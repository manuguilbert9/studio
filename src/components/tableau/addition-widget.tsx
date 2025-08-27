'use client';

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
  'border-slate-900', // Dixaines de milliers
];

const getBorderColor = (colIndexFromRight: number) => {
    if (colIndexFromRight > 2) return 'border-slate-900';
    return colors[colIndexFromRight] || 'border-slate-900';
}

const getCarryColor = (colIndexFromRight: number) => {
    // The carry's color is the one from the column to its right
    const targetColorIndex = colIndexFromRight + 1;
     if (targetColorIndex > 2) return 'border-slate-900';
    return colors[targetColorIndex] || 'border-slate-900';
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

  // Define grid columns dynamically
  // [Arrow] [Result-Carry] [Num-Cols...] [Plus-Sign] [Arrow]
  const gridColsStyle = {
      gridTemplateColumns: `auto auto repeat(${numCols}, auto) auto auto`
  };


  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start">
        <div className="p-1 cursor-grab drag-handle h-full flex items-center">
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>

        <div className="flex flex-col items-center">
            {/* Carry Row */}
            <div className="flex justify-end items-center h-10 w-full mb-1">
                <div className="flex items-center gap-2" style={{ paddingLeft: '56px' }}> {/* Spacer for result carry */}
                    {[...Array(numCols - 1)].map((_, i) => (
                        <CarryCell key={i} borderColor={getCarryColor(numCols - 2 - i)} />
                    ))}
                </div>
                <div className="w-12"/> {/* Spacer for plus sign */}
            </div>

            {/* Operands */}
            {[...Array(numOperands)].map((_, index) => (
               <div key={index} className="flex items-center justify-end">
                    <div className="w-12"/> {/* Spacer for result carry */}
                    <div className="flex items-center gap-2">
                        {[...Array(numCols)].map((_, i) => (
                            <CalcCell key={i} borderColor={getBorderColor(numCols - 1 - i)} />
                        ))}
                    </div>
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                         {index === numOperands - 1 && numOperands < 3 ? (
                            <Button onClick={addOperand} size="icon" variant="ghost" className="h-10 w-10 text-slate-500 hover:text-slate-800">
                                <Plus className="w-6 h-6" />
                            </Button>
                        ) : (
                           <span className={cn("text-slate-500 text-3xl", index < numOperands - 1 && "+")}>&nbsp;</span>
                        )}
                    </div>
                </div>
            ))}
            
            {/* Result Bar */}
             <div className="h-0.5 bg-slate-800 my-1 self-stretch ml-12 mr-[calc(1.5rem+48px)]"></div>

            {/* Result Row */}
             <div className="flex items-center">
                <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2} className="w-10 h-12">
                    <ChevronLeft/>
                </Button>
                <div className="flex items-center gap-2">
                     {[...Array(numCols + 1)].map((_, i) => (
                        <CalcCell key={i} borderColor={getBorderColor(numCols - i)} />
                    ))}
                </div>
                <Button onClick={expandCols} size="icon" variant="ghost" disabled={numCols >= 5} className="w-10 h-12">
                    <ChevronRight/>
                </Button>
            </div>
        </div>

        <button onClick={onClose} className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
