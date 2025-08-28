'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import 'react-resizable/css/styles.css';
import type { DateWidgetState, Position, Size } from '@/services/tableau';


interface DateWidgetProps {
  initialState: DateWidgetState;
  onUpdate: (state: DateWidgetState) => void;
  onClose: () => void;
}

export function DateWidget({ initialState, onUpdate, onClose }: DateWidgetProps) {
  const [date, setDate] = useState(new Date());
  const [dateFormat, setDateFormat] = useState<'long' | 'short'>(initialState.dateFormat);
  const [pos, setPos] = useState<Position>(initialState.pos);
  const [size, setSize] = useState<Size>(initialState.size);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerUpdate = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
        onUpdate({
            id: initialState.id,
            pos,
            size,
            dateFormat,
        });
    }, 500); // Debounce updates
  }, [pos, size, dateFormat, onUpdate, initialState.id]);

  useEffect(() => {
    triggerUpdate();
  }, [pos, size, dateFormat, triggerUpdate]);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  
  const fontSize = Math.max(12, Math.min(size.width / 15, size.height * 0.5));

  const formattedDate = dateFormat === 'short'
    ? new Intl.DateTimeFormat('fr-FR').format(date)
    : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle')) {
        return;
    }
    isDragging.current = true;
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    document.documentElement.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging.current) {
          setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
        }
    };
    const handleMouseUp = () => {
        if (isDragging.current) {
            isDragging.current = false;
            document.documentElement.style.cursor = 'default';
            triggerUpdate();
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [triggerUpdate]);
  
  const handleResizeStop = (e: any, data: any) => {
    setSize({ width: data.size.width, height: data.size.height });
    triggerUpdate();
  }

  return (
    <div
      ref={widgetRef}
      className="absolute z-30 group"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        onResizeStop={handleResizeStop}
        minConstraints={[200, 50]}
        maxConstraints={[800, 200]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
      >
        <Card
          className="w-full h-full p-4 shadow-none group-hover:shadow-2xl bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-2 border border-transparent group-hover:border-border transition-all"
          onDoubleClick={() => setDateFormat(f => f === 'short' ? 'long' : 'short')}
        >
          <div
            className="p-1 cursor-grab self-stretch flex items-center"
          >
            <GripVertical className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-grow flex items-center justify-center h-full">
            <p
              className="font-sans font-semibold select-none text-slate-800 text-center"
              style={{ fontSize: `${fontSize}px` }}
            >
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </p>
          </div>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </Card>
      </ResizableBox>
    </div>
  );
}
