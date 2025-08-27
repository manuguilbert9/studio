
'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { CalcCell } from './calc-cell';

interface AdditionWidgetProps {
  onClose: () => void;
}

const initialPosition = {
  x: window.innerWidth / 2 - 200,
  y: 100,
};

export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [position, setPosition] = useState(initialPosition);
  const [carry, setCarry] = useState({ tens: 0, hundreds: 0 }); // 0: empty, 1: has 1, 2: crossed
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      isDragging.current = true;
      offset.current = {
        x: e.clientX - cardRef.current.getBoundingClientRect().left,
        y: e.clientY - cardRef.current.getBoundingClientRect().top,
      };
      cardRef.current.style.cursor = 'grabbing';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current && cardRef.current) {
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (cardRef.current) {
      cardRef.current.style.cursor = 'grab';
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  const toggleCarry = (type: 'tens' | 'hundreds') => {
    setCarry(prev => ({
        ...prev,
        [type]: (prev[type] + 1) % 3
    }));
  }

  const renderCarry = (value: number) => {
    if (value === 1) return '1';
    if (value === 2) return <span className="relative text-red-500">1<span className="absolute left-0 top-1/2 w-full h-0.5 bg-red-500 transform -translate-y-1/2 rotate-[-15deg]"></span></span>;
    return '';
  }

  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-1 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>

        <div className="grid grid-cols-4 gap-x-2 items-center text-4xl font-bold font-mono">
            {/* Empty cell for alignment */}
            <div></div>

            {/* Carry row */}
            <div 
                className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center text-2xl cursor-pointer"
                onClick={() => toggleCarry('hundreds')}
            >
                {renderCarry(carry.hundreds)}
            </div>
            <div 
                className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center text-2xl cursor-pointer"
                onClick={() => toggleCarry('tens')}
            >
                {renderCarry(carry.tens)}
            </div>
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
            <div className="col-span-4 h-1 bg-slate-800 my-2"></div>
            
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
