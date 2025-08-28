'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, GripVertical, X } from 'lucide-react';
import 'react-resizable/css/styles.css';
import type { TimerWidgetState, Position, Size } from '@/services/tableau';


interface TimerWidgetProps {
    initialState: TimerWidgetState;
    onUpdate: (state: TimerWidgetState) => void;
    onClose: () => void;
}

export function TimerWidget({ initialState, onUpdate, onClose }: TimerWidgetProps) {
  const [time, setTime] = useState(0); // Time is transient, not saved
  const [isRunning, setIsRunning] = useState(false);
  const [pos, setPos] = useState<Position>(initialState.pos);
  const [size, setSize] = useState<Size>(initialState.size);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
        });
    }, 500); // Debounce updates
  }, [pos, size, onUpdate, initialState.id]);

  useEffect(() => {
    triggerUpdate();
  }, [pos, size, triggerUpdate]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle') || (e.target as HTMLElement).closest('button')) {
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
  
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  }
  
  const handleResizeStop = (e: any, data: any) => {
    setSize({ width: data.size.width, height: data.size.height });
    triggerUpdate();
  }

  const fontSize = Math.max(24, Math.min(size.width / 7, size.height * 0.6));
  const buttonSize = Math.max(24, Math.min(size.width / 12, size.height / 3));

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
            minConstraints={[250, 80]}
            maxConstraints={[800, 300]}
            handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
        >
            <Card
                className="w-full h-full p-4 shadow-none group-hover:shadow-2xl bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-4 border border-transparent group-hover:border-border transition-all"
            >
                <div
                    className="p-1 cursor-grab self-stretch flex items-center"
                >
                    <GripVertical className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex-grow text-center">
                    <p className="font-mono font-bold text-slate-800 select-none" style={{ fontSize: `${fontSize}px`}}>
                        <span>{("0" + Math.floor(time / 60)).slice(-2)}:</span>
                        <span>{("0" + (time % 60)).slice(-2)}</span>
                    </p>
                </div>

                <div className="flex flex-col gap-2 border-l pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button style={{width: buttonSize, height: buttonSize}} size="icon" onClick={() => setIsRunning(!isRunning)} variant={isRunning ? "destructive" : "default"}>
                        {isRunning ? <Pause/> : <Play/>}
                    </Button>
                    <Button style={{width: buttonSize, height: buttonSize}} size="icon" onClick={resetTimer} variant="outline">
                        <RefreshCw/>
                    </Button>
                </div>
                <button onClick={onClose} className="absolute top-2 right-2 bg-slate-600 text-white rounded-full p-1 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" />
                </button>
            </Card>
        </ResizableBox>
    </div>
  );
}
