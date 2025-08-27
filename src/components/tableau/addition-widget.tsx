'use client';

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
];
const getBorderColor = (colIndexFromRight: number) => {
    if (colIndexFromRight > 2) return 'border-slate-900';
    return colors[colIndexFromRight] || 'border-slate-900';
}

const OperandRow = ({ numCols, onAdd }: { numCols: number; onAdd?: () => void }) => {
    return (
        <div className="flex items-center justify-end">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                {onAdd ? (
                    <Button onClick={onAdd} size="icon" variant="ghost" className="h-10 w-10 text-slate-500 hover:text-slate-800">
                        <Plus className="w-6 h-6" />
                    </Button>
                ) : (
                    <span className="text-slate-500 text-3xl">+</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                {[...Array(numCols)].map((_, i) => (
                    <CalcCell key={i} borderColor={getBorderColor(numCols - 1 - i)} />
                ))}
            </div>
        </div>
    );
}

const ResultRow = ({ numCols }: { numCols: number }) => {
     return (
        <div className="flex items-center justify-end">
             {/* Result has one extra cell for final carry */}
             <div className="flex items-center gap-2">
                {[...Array(numCols + 1)].map((_, i) => (
                    <CalcCell key={i} borderColor={getBorderColor(numCols - i)} />
                ))}
            </div>
        </div>
    );
};

const CarryRow = ({ numCols }: { numCols: number }) => {
    return (
        <div className="flex items-center justify-end h-10 gap-2 pr-[calc(0.5rem+56px)]">
             {[...Array(numCols -1)].map((_, i) => (
                <CarryCell key={i} borderColor={getBorderColor(numCols - 1 - i)} />
            ))}
        </div>
    );
};


export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') {
      return initialPosition;
    }
    return { x: window.innerWidth / 2 - 200, y: 100 };
  });

  const [numOperands, setNumOperands] = useState(2);
  const [numCols, setNumCols] = useState(3);

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
        <div className="flex items-start">
             <div className="p-1 cursor-grab drag-handle h-full flex items-center">
                <GripVertical className="h-6 w-6 text-slate-400" />
            </div>

            <div className="flex flex-col items-end">
                {/* Empty space to align with +/- button */}
                <div className="h-10 w-12" /> 

                <CarryRow numCols={numCols} />

                {[...Array(numOperands)].map((_, index) => (
                    <OperandRow 
                        key={index}
                        numCols={numCols} 
                        onAdd={index === numOperands -1 && numOperands < 3 ? addOperand : undefined}
                    />
                ))}
                
                <div className="h-0.5 bg-slate-800 my-1 self-stretch"></div>
                
                <div className="flex items-center justify-end">
                     <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2} className="w-10 h-12">
                        <ChevronLeft/>
                    </Button>
                    <div className="flex-grow">
                        <ResultRow numCols={numCols} />
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
