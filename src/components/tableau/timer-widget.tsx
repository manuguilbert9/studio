'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, GripVertical, X } from 'lucide-react';

interface TimerWidgetProps {
    onClose: () => void;
}

export function TimerWidget({ onClose }: TimerWidgetProps) {
  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 150, y: 150 });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

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
  
  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
  }

  return (
    <Card
      ref={cardRef}
      className="absolute z-30 p-4 shadow-2xl bg-white/90 backdrop-blur-sm rounded-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="p-1 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-6 w-6 text-slate-400" />
        </div>
        
        <div className="text-center">
            <p className="font-mono text-5xl font-bold text-slate-800 select-none">
                <span>{("0" + Math.floor(time / 60)).slice(-2)}:</span>
                <span>{("0" + (time % 60)).slice(-2)}</span>
            </p>
        </div>

        <div className="flex flex-col gap-2 border-l pl-4">
            <Button size="icon" onClick={() => setIsRunning(!isRunning)} variant={isRunning ? "destructive" : "default"}>
                {isRunning ? <Pause/> : <Play/>}
            </Button>
             <Button size="icon" onClick={resetTimer} variant="outline">
                <RefreshCw/>
            </Button>
        </div>
         <button onClick={onClose} className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-1 hover:bg-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}
