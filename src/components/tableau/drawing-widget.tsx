
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Brush, Eraser, Trash2 } from 'lucide-react';
import 'react-resizable/css/styles.css';
import type { DrawingWidgetState, Position, Size } from '@/services/tableau.types';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

interface DrawingWidgetProps {
  initialState: DrawingWidgetState;
  onUpdate: (state: DrawingWidgetState) => void;
  onClose: () => void;
}

const colors = ['#000000', '#ef4444', '#22c55e', '#3b82f6'];

export function DrawingWidget({ initialState, onUpdate, onClose }: DrawingWidgetProps) {
  const [pos, setPos] = useState<Position>(initialState.pos);
  const [size, setSize] = useState<Size>(initialState.size);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isErasing, setIsErasing] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const isDraggingWidget = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerUpdate = useCallback(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
        if (canvasRef.current) {
            const drawingData = canvasRef.current.toDataURL();
            onUpdate({
                id: initialState.id,
                pos,
                size,
                drawingData,
            });
        }
    }, 1000); // Debounce updates by 1 second
  }, [pos, size, onUpdate, initialState.id]);

  const drawLine = (x0: number, y0: number, x1: number, y1: number, color: string, width: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current || !lastPos.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const color = isErasing ? '#FFFFFF' : brushColor;
    const width = isErasing ? brushSize * 3 : brushSize;
    drawLine(lastPos.current.x, lastPos.current.y, offsetX, offsetY, color, width);
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
    triggerUpdate(); // Save state when drawing stops
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if(canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        triggerUpdate();
    }
  }


  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && initialState.drawingData) {
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.onload = () => {
        ctx?.drawImage(image, 0, 0);
      };
      image.src = initialState.drawingData;
    }
  }, [initialState.drawingData]);


  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle, canvas, button, input')) {
        return;
    }
    isDraggingWidget.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.documentElement.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingWidget.current) return;
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      if (!isDraggingWidget.current) return;
      isDraggingWidget.current = false;
      document.documentElement.style.cursor = 'default';
      triggerUpdate(); 
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [triggerUpdate]);
  
  const handleResizeStop = (e: any, data: any) => {
     const newSize = { width: data.size.width, height: data.size.height };
    
    // Save current drawing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size.width;
    tempCanvas.height = size.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (canvasRef.current) {
        tempCtx?.drawImage(canvasRef.current, 0, 0);
    }

    // Apply new size
    setSize(newSize);

    // Redraw old content onto resized canvas
    setTimeout(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.drawImage(tempCanvas, 0, 0);
            triggerUpdate();
        }
    }, 0);
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
        minConstraints={[250, 200]}
        maxConstraints={[1200, 1000]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
      >
        <Card className="w-full h-full p-2 bg-white/90 backdrop-blur-sm rounded-lg flex flex-col items-start gap-2 select-none border border-transparent group-hover:shadow-lg group-hover:border-slate-300 transition-all">
            <div className="flex items-center w-full cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-6 w-6 text-slate-400" />
                <div className="flex items-center gap-2 p-1 rounded-md ml-2">
                    <Button variant={!isErasing ? 'secondary' : 'ghost'} size="icon" className="w-8 h-8" onClick={() => setIsErasing(false)}>
                        <Brush className="h-4 w-4"/>
                    </Button>
                    <Button variant={isErasing ? 'secondary' : 'ghost'} size="icon" className="w-8 h-8" onClick={() => setIsErasing(true)}>
                        <Eraser className="h-4 w-4"/>
                    </Button>

                     <div className="flex gap-1 ml-2">
                        {colors.map(color => (
                            <Button 
                                key={color}
                                variant="outline"
                                size="icon" 
                                className="w-6 h-6 p-0"
                                onClick={() => { setBrushColor(color); setIsErasing(false); }}
                                style={{borderColor: brushColor === color && !isErasing ? 'blue' : 'transparent'}}
                            >
                                <div className='w-4 h-4 rounded-full' style={{backgroundColor: color}} />
                            </Button>
                        ))}
                    </div>

                    <Slider
                        value={[brushSize]}
                        onValueChange={(val) => setBrushSize(val[0])}
                        min={1} max={20} step={1}
                        className="w-24 ml-4"
                    />

                    <Button variant="ghost" size="icon" className="w-8 h-8 ml-auto" onClick={clearCanvas}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
            
            <canvas
                ref={canvasRef}
                width={size.width - 16}
                height={size.height - 56}
                className="bg-white rounded-md cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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
