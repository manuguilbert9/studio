'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { TextToolbar } from './text-toolbar';
import { cn } from '@/lib/utils';
import 'react-resizable/css/styles.css';
import type { TextWidgetState, Position, Size } from '@/services/tableau';


interface TextWidgetProps {
  initialState: TextWidgetState;
  onUpdate: (state: TextWidgetState) => void;
  onClose: () => void;
}

export function TextWidget({ initialState, onUpdate, onClose }: TextWidgetProps) {
  const [pos, setPos] = useState<Position>(initialState.pos);
  const [size, setSize] = useState<Size>(initialState.size);
  const [text, setText] = useState(initialState.text);
  const [fontSize, setFontSize] = useState(initialState.fontSize);
  const [color, setColor] = useState(initialState.color);
  const [isUnderlined, setIsUnderlined] = useState(initialState.isUnderlined);

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
        text,
        fontSize,
        color,
        isUnderlined,
      });
    }, 500); // Debounce updates
  }, [pos, size, text, fontSize, color, isUnderlined, onUpdate, initialState.id]);
  
  useEffect(() => {
    triggerUpdate();
  }, [pos, size, text, fontSize, color, isUnderlined, triggerUpdate]);

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
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
        minConstraints={[200, 120]}
        maxConstraints={[1000, 800]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
      >
        <Card className="w-full h-full p-2 shadow-lg bg-white/95 backdrop-blur-sm rounded-lg flex flex-col items-start gap-2 select-none border group-hover:border-slate-400 transition-all">
          <div
            className="flex items-center w-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Déplacer le widget"
          >
            <GripVertical className="h-6 w-6 text-slate-400" />
            <TextToolbar
                fontSize={fontSize}
                setFontSize={setFontSize}
                setColor={setColor}
                toggleUnderline={() => setIsUnderlined(p => !p)}
            />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cn(
                "w-full h-full bg-transparent resize-none focus:outline-none px-2 font-body",
                color,
                isUnderlined && 'underline'
            )}
            style={{ fontSize: `${fontSize}px` }}
            placeholder="Écrivez ici..."
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
