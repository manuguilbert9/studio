
'use client';

import { useState, useRef, useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X } from 'lucide-react';
import { TextToolbar } from './text-toolbar';
import { cn } from '@/lib/utils';
import 'react-resizable/css/styles.css';

interface TextWidgetProps {
  onClose: () => void;
}

export function TextWidget({ onClose }: TextWidgetProps) {
  const [position, setPosition] = useState(() => {
     if (typeof window === 'undefined') return { x: 250, y: 150 };
     return { x: window.innerWidth / 2 - 150, y: 150 };
  });
  const [size, setSize] = useState({ width: 300, height: 200 });
  const [text, setText] = useState('');
  
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState('text-slate-900');
  const [isUnderlined, setIsUnderlined] = useState(false);


  const widgetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
        return;
    }
    isDragging.current = true;
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    document.documentElement.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.documentElement.style.cursor = 'default';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);


  return (
    <div
      ref={widgetRef}
      className="absolute z-30 group"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={onHandleMouseDown}
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        onResizeStop={(e, data) => setSize({ width: data.size.width, height: data.size.height })}
        minConstraints={[200, 120]}
        maxConstraints={[1000, 800]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
      >
        <Card className="w-full h-full p-2 shadow-none group-hover:shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg flex flex-col items-start gap-2 select-none border border-transparent group-hover:border-border transition-all">
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
