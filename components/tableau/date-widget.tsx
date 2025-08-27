'use client';

import { useState, useEffect, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { fr } from 'date-fns/locale';

interface DateWidgetProps {
  onClose: () => void;
}

export function DateWidget({ onClose }: DateWidgetProps) {
  const [date, setDate] = useState(new Date());
  const [dateFormat, setDateFormat] = useState<'long' | 'short'>('long');
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 200, y: 100 });
  const [size, setSize] = useState({ width: 450, height: 70 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  // Dynamically calculate font size based on widget width
  const fontSize = Math.max(12, Math.min(size.width / 15, size.height * 0.5));

  const formattedDate = dateFormat === 'short'
    ? new Intl.DateTimeFormat('fr-FR').format(date)
    : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent dragging when clicking on the resize handle
    if ((e.target as HTMLElement).classList.contains('react-resizable-handle')) {
        return;
    }
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
    <div
      ref={cardRef}
      className="absolute z-30"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        onResizeStop={(e, data) => setSize({ width: data.size.width, height: data.size.height })}
        minConstraints={[200, 50]}
        maxConstraints={[800, 200]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize" />}
      >
        <Card
          className="w-full h-full p-4 shadow-2xl bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-2"
          onDoubleClick={() => setDateFormat(f => f === 'short' ? 'long' : 'short')}
        >
          <div
            className="p-1 cursor-grab self-stretch flex items-center"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex-grow flex items-center justify-center h-full">
            <p
              className="font-sans font-semibold select-none text-slate-800 text-center"
              style={{ fontSize: `${fontSize}px` }}
            >
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </p>
          </div>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </Card>
      </ResizableBox>
    </div>
  );
}
