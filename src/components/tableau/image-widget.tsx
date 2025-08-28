
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import 'react-resizable/css/styles.css';
import type { ImageWidgetState, Position, Size } from '@/services/tableau.types';

interface ImageWidgetProps {
  initialState: ImageWidgetState;
  onUpdate: (state: ImageWidgetState) => void;
  onClose: () => void;
}

export function ImageWidget({ initialState, onUpdate, onClose }: ImageWidgetProps) {
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
            src: initialState.src,
        });
    }, 500); // Debounce updates
  }, [pos, size, onUpdate, initialState.id, initialState.src]);

  useEffect(() => {
    triggerUpdate();
  }, [pos, size, triggerUpdate]);

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle') || (e.target as HTMLElement).closest('button')) {
        return;
    }
    isDragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.documentElement.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.documentElement.style.cursor = 'default';
      triggerUpdate(); // Final update on drag end
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
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
      onMouseDown={onHandleMouseDown}
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        onResizeStop={handleResizeStop}
        minConstraints={[100, 100]}
        maxConstraints={[1200, 1000]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
      >
        <Card className="w-full h-full p-2 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center select-none border border-transparent group-hover:shadow-lg group-hover:border-slate-300 transition-all overflow-hidden">
          <div
            className="absolute top-1/2 -left-0.5 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Déplacer le widget"
          >
            <GripVertical className="h-6 w-6 text-slate-500 bg-white/50 rounded-full" />
          </div>
          
          <img 
            src={initialState.src} 
            alt="Pasted content"
            className="w-full h-full object-contain"
            draggable="false"
          />

          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </Card>
      </ResizableBox>
    </div>
  );
}

    