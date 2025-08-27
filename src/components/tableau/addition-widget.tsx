
'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';

interface AdditionWidgetProps {
  onClose: () => void;
}

const initialPosition = {
  x: window.innerWidth / 2 - 160,
  y: 100,
};

export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [position, setPosition] = useState(initialPosition);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag if the handle is clicked
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
        isDragging.current = true;
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        cardRef.current!.style.cursor = 'grabbing';
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
    if (cardRef.current) {
        cardRef.current.style.cursor = 'default';
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-1 cursor-grab drag-handle"
        >
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>

        <div className="grid grid-cols-4 gap-x-1 items-center text-3xl font-bold font-mono">
            {/* Empty cell for alignment */}
            <div></div>

            {/* Carry row */}
            <CarryCell borderColor="border-green-500" />
            <CarryCell borderColor="border-red-500" />
            <div></div>

            {/* First Number */}
            <div></div>
            <CalcCell borderColor="border-green-500" />
            <CalcCell borderColor="border-red-500" />
            <CalcCell borderColor="border-blue-500" />

            {/* Second Number */}
            <div className="text-center">+</div>
            <CalcCell borderColor="border-green-500" />
            <CalcCell borderColor="border-red-500" />
            <CalcCell borderColor="border-blue-500" />
            
            {/* Separator Line */}
            <div className="col-span-4 h-0.5 bg-slate-800 my-1"></div>
            
            {/* Result */}
            <CalcCell borderColor="border-black" />
            <CalcCell borderColor="border-green-500" />
            <CalcCell borderColor="border-red-500" />
            <CalcCell borderColor="border-blue-500" />
        </div>

        <button onClick={onClose} className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
