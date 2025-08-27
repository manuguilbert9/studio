
'use client';

import { useState, useRef, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdditionWidgetProps {
  onClose: () => void;
}

const initialPosition = {
  x: typeof window !== 'undefined' ? window.innerWidth / 2 - 200 : 200,
  y: 100,
};

const colors = [
  'border-blue-500',  // Unités
  'border-red-500',   // Dizaines
  'border-green-500', // Centaines
  'border-yellow-400',// Milliers
  'border-purple-500',// Dizaines de milliers
  'border-orange-500',// Centaines de milliers
];

const getBorderColor = (index: number, totalCols: number) => {
    const colorIndex = (totalCols - 1 - index) % colors.length;
    return colors[colorIndex];
}

const OperandRow = ({ numCols, colorOffset = 0, onAdd }: { numCols: number, colorOffset?: number, onAdd?: () => void }) => (
    <div className="contents">
        <div className="flex items-center justify-center">
            {onAdd ? (
                 <button
                    onClick={onAdd}
                    className="flex items-center justify-center h-10 w-10 text-center text-slate-500 rounded-md cursor-pointer hover:bg-slate-200 disabled:cursor-default disabled:opacity-50"
                >
                    +
                </button>
            ) : <div className="w-10 h-10" />}
        </div>
        {[...Array(numCols)].map((_, i) => (
            <CalcCell key={i} borderColor={getBorderColor(i + colorOffset, numCols + colorOffset)} />
        ))}
    </div>
);

const ResultRow = ({ numCols, onExpand, onShrink }: { numCols: number, onExpand: () => void, onShrink: () => void }) => (
     <div className="contents">
        <div className="flex items-center justify-center">
            <Button onClick={onShrink} size="icon" variant="ghost" className="h-10 w-10">
                <ChevronLeft/>
            </Button>
        </div>
        {/* Result has one extra cell */}
        {[...Array(numCols + 1)].map((_, i) => (
             <CalcCell key={i} borderColor={getBorderColor(i, numCols + 1)} />
        ))}
         <div className="flex items-center justify-center">
            <Button onClick={onExpand} size="icon" variant="ghost" className="h-10 w-10">
                <ChevronRight/>
            </Button>
        </div>
    </div>
);


const CarryRow = ({ numCols }: { numCols: number }) => (
    <div className="contents">
        {/* Empty cell for the operand symbol */}
        <div /> 
        {/* Empty cell to align with result's extra digit */}
        <div />
        {[...Array(numCols - 1)].map((_, i) => (
            <CarryCell key={i} borderColor={getBorderColor(i, numCols -1)} />
        ))}
    </div>
);

export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [position, setPosition] = useState(initialPosition);
  const [numOperands, setNumOperands] = useState(2);
  const [numCols, setNumCols] = useState(3); // Start with Units, Tens, Hundreds

  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
        isDragging.current = true;
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        document.body.style.cursor = 'grabbing';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      setPosition({
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
  
  const addOperand = () => {
      if (numOperands < 3) {
          setNumOperands(numOperands + 1);
      }
  }

  const expandCols = () => setNumCols(c => Math.min(c + 1, 5)); // Max 5 columns for now
  const shrinkCols = () => setNumCols(c => Math.max(c - 1, 2)); // Min 2 columns

  const gridStyle = {
      gridTemplateColumns: `auto repeat(${numCols + 1}, auto)`
  };

  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start gap-4">
        <div className="p-1 cursor-grab drag-handle">
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>

        <div className="grid gap-x-1 gap-y-2 items-center text-3xl font-bold font-mono" style={gridStyle}>
            {/* Carry row */}
            <CarryRow numCols={numCols} />

            {/* Operands */}
            {[...Array(numOperands)].map((_, index) => (
                <OperandRow 
                    key={index}
                    numCols={numCols} 
                    onAdd={index === 1 && numOperands < 3 ? addOperand : undefined}
                />
            ))}
            
            {/* Separator Line */}
            <div className="col-span-full h-0.5 bg-slate-800 my-1"></div>
            
            {/* Result */}
            <ResultRow numCols={numCols} onExpand={expandCols} onShrink={shrinkCols} />
        </div>

        <button onClick={onClose} className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
