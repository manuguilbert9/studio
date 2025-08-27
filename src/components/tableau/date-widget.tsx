'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DateWidgetProps {
  format: 'short' | 'long';
  onClose: () => void;
}

export function DateWidget({ format: initialFormat, onClose }: DateWidgetProps) {
  const [date, setDate] = useState(new Date());
  const [format, setFormat] = useState(initialFormat);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 150, y: 100 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format === 'short'
    ? new Intl.DateTimeFormat('fr-FR').format(date)
    : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);

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

  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/90 backdrop-blur-sm rounded-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onDoubleClick={() => setFormat(f => f === 'short' ? 'long' : 'short')}
    >
      <div className="flex items-center gap-2">
        <div
          className="p-1 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>
        <p className="font-sans text-2xl font-semibold select-none text-slate-800">
          {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
        </p>
         <button onClick={onClose} className="ml-2 p-1 text-slate-400 hover:text-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
