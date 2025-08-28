'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { Button } from '@/components/ui/button';
import type { AdditionWidgetState, Position, Size } from '@/services/tableau';
import 'react-resizable/css/styles.css';


interface AdditionWidgetProps {
  initialState: AdditionWidgetState;
  onUpdate: (state: AdditionWidgetState) => void;
  onClose: () => void;
}

const colors = [
  'border-blue-500',  
  'border-red-500',   
  'border-green-500', 
  'border-slate-900', 
];

const getBorderColor = (colIndexFromRight: number) =>
  colors[colIndexFromRight] || 'border-slate-900';

export function AdditionWidget({ initialState, onUpdate, onClose }: AdditionWidgetProps) {
  const [pos, setPos] = useState<Position>(initialState.pos);
  const [size, setSize] = useState<Size>(initialState.size);
  const [numOperands, setNumOperands] = useState(initialState.numOperands);
  const [numCols, setNumCols] = useState(initialState.numCols); 

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
            numOperands,
            numCols
        });
    }, 500); // Debounce updates
  }, [pos, size, numOperands, numCols, onUpdate, initialState.id]);

  useEffect(() => {
    triggerUpdate();
  }, [pos, size, numOperands, numCols, triggerUpdate]);

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-resizable-handle') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
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

  const addOperand = () => setNumOperands(c => Math.min(c + 1, 3));
  const expandCols = () => setNumCols(c => Math.min(c + 1, 4));
  const shrinkCols = () => setNumCols(c => Math.max(c - 1, 2));

  const colsLeftToRight = React.useMemo(
    () => Array.from({ length: numCols }, (_, i) => numCols - 1 - i),
    [numCols]
  );
  
  const cellSize = Math.max(20, Math.min(size.width / (numCols + 3), size.height / (numOperands + 4)));
  const fontSize = cellSize * 0.6;
  const carrySize = cellSize * 0.8;
  const carryFontSize = carrySize * 0.5;
  
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
        minConstraints={[300, 200]}
        maxConstraints={[800, 600]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
    >
    <Card
      className="w-full h-full p-4 shadow-lg bg-white/95 backdrop-blur-sm rounded-lg flex items-start gap-2 select-none border group-hover:border-slate-400 transition-all"
    >
      <div
        className="flex items-center h-full cursor-grab pt-16 pr-1 self-stretch"
        aria-label="Déplacer le widget"
      >
        <GripVertical className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-col items-center flex-grow h-full justify-center">
        <div className="flex items-start">
          <div className="flex flex-col items-center m-1">
            <div style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}} />
            {[...Array(numOperands)].map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center" style={{height: cellSize}}>
                {rowIndex === numOperands - 1 && (
                  <span className="text-slate-500 font-light" style={{fontSize: `${fontSize}px`}}>+</span>
                )}
              </div>
            ))}
            <div className="my-1" style={{ height: '2px', width: cellSize, opacity: 0 }} />
            <div style={{height: cellSize}} />
          </div>

          <div className="flex flex-col items-center m-1">
             <div style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}} />
            {[...Array(numOperands)].map((_, i) => (
              <div key={i} style={{width: cellSize, height: cellSize}} />
            ))}
            <div className="bg-slate-800 my-1" style={{height: '2px', width: cellSize}} />
            <div style={{height: cellSize}}>
              <CalcCell borderColor={getBorderColor(numCols)} size={cellSize} fontSize={fontSize}/>
            </div>
          </div>

          {colsLeftToRight.map((colFromRight) => {
            const borderColor = getBorderColor(colFromRight);
            return (
              <div key={colFromRight} className="flex flex-col items-center m-1">
                <div className="flex items-center justify-center" style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}}>
                  {colFromRight > 0 && <CarryCell borderColor={borderColor} size={carrySize} fontSize={carryFontSize} />}
                </div>

                {[...Array(numOperands)].map((_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center" style={{height: cellSize}}>
                    <CalcCell borderColor={borderColor} size={cellSize} fontSize={fontSize} />
                  </div>
                ))}

                <div className="bg-slate-800 my-1" style={{height: '2px', width: cellSize}} />

                <div style={{height: cellSize}}>
                  <CalcCell borderColor={borderColor} size={cellSize} fontSize={fontSize} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center w-full mt-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2} aria-label="Retirer une colonne">
            <ChevronLeft />
          </Button>

          {numOperands < 3 && (
            <Button
              onClick={addOperand}
              size="sm"
              variant="ghost"
              className="text-slate-500 hover:text-slate-800"
              aria-label="Ajouter un nombre"
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter nombre
            </Button>
          )}

          <Button onClick={expandCols} size="icon" variant="ghost" disabled={numCols >= 4} aria-label="Ajouter une colonne">
            <ChevronRight />
          </Button>
        </div>
      </div>

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
