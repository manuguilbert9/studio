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
];

const getBorderColor = (colIndexFromRight: number) => {
    if (colIndexFromRight >= 3) return 'border-slate-900';
    return colors[colIndexFromRight] || 'border-slate-900';
}

const getCarryColor = (colIndexFromRight: number) => {
    // The carry's color is the one from the column it sits above
    return getBorderColor(colIndexFromRight);
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
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex">
        <div className="p-1 cursor-grab drag-handle h-full flex items-center">
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>

        <div className="flex flex-col items-center">
            {/* Main Calculation Grid */}
            <div className="inline-grid auto-cols-auto gap-x-2">
                {/* Carry Row */}
                <div className="col-start-2 col-span-full grid grid-cols-subgrid">
                    {[...Array(numCols - 1)].map((_, i) => (
                         <div key={i} className={cn("col-start-1", `col-start-[${i+1}]`)}>
                            <CarryCell borderColor={getCarryColor(numCols - 1 - i)} />
                         </div>
                    ))}
                </div>

                {/* Operands */}
                {[...Array(numOperands)].map((_, rowIndex) => (
                    <div key={rowIndex} className={`row-start-[${rowIndex+2}] col-span-full grid grid-cols-subgrid`}>
                         <div className="col-start-1 flex-shrink-0 w-12 h-12 flex items-center justify-center">
                            {rowIndex === numOperands - 2 && (
                               <span className="text-slate-500 text-3xl">+</span>
                            )}
                         </div>
                        {[...Array(numCols)].map((_, colIndex) => (
                            <div key={colIndex} className={`col-start-[${colIndex+2}]`}>
                                <CalcCell borderColor={getBorderColor(numCols - 1 - colIndex)} />
                            </div>
                        ))}
                    </div>
                ))}
                
                {/* Result Bar */}
                <div className={`row-start-[${numOperands+2}] col-start-2 col-span-full h-0.5 bg-slate-800 my-1 self-stretch`}></div>

                {/* Result Row */}
                 <div className={`row-start-[${numOperands+3}] col-span-full grid grid-cols-subgrid`}>
                     {[...Array(numCols + 1)].map((_, i) => (
                        <div key={i} className={`col-start-[${i+1}]`}>
                           <CalcCell borderColor={getBorderColor(numCols - i)} />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Column controls */}
             <div className="flex items-center justify-center w-full mt-2">
                <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2}>
                    <ChevronLeft/>
                </Button>
                <div className="flex-grow"></div>
                <Button onClick={expandCols} size="icon" variant="ghost" disabled={numCols >= 5}>
                    <ChevronRight/>
                </Button>
            </div>

             {/* Operand controls */}
              {numOperands < 3 && (
                <div className="mt-2">
                    <Button onClick={addOperand} size="sm" variant="ghost" className="text-slate-500 hover:text-slate-800">
                        <Plus className="w-4 h-4 mr-2" /> Ajouter un nombre
                    </Button>
                </div>
            )}
        </div>

        <button onClick={onClose} className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
