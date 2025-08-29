
'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Card } from '@/components/ui/card';
import { GripVertical, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { Button } from '@/components/ui/button';
import type { SoustractionWidgetState, Position, Size } from '@/services/tableau.types';
import 'react-resizable/css/styles.css';


interface SoustractionWidgetProps {
  initialState: SoustractionWidgetState;
  onUpdate: (state: SoustractionWidgetState) => void;
  onClose: () => void;
}

// Units: Blue, Tens: Red, Hundreds: Green
const colors = [
  'border-blue-500',
  'border-red-500',
  'border-green-500',
  'border-slate-900',
];

const getBorderColor = (colIndexFromRight: number) =>
  colors[colIndexFromRight] || 'border-slate-900';

export function SoustractionWidget({ initialState, onUpdate, onClose }: SoustractionWidgetProps) {
  const [pos, setPos] = useState<Position>(initialState.pos);
  const [size, setSize] = useState<Size>(initialState.size);
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
            numCols
        });
    }, 500); // Debounce updates
  }, [pos, size, numCols, onUpdate, initialState.id]);

  useEffect(() => {
    triggerUpdate();
  }, [pos, size, numCols, triggerUpdate]);

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

  const expandCols = () => setNumCols(c => Math.min(c + 1, 4));
  const shrinkCols = () => setNumCols(c => Math.max(c - 1, 2));

  const colsLeftToRight = React.useMemo(
    () => Array.from({ length: numCols }, (_, i) => numCols - 1 - i),
    [numCols]
  );
  
  const cellSize = Math.max(20, Math.min(size.width / (numCols + 2), size.height / 5));
  const fontSize = cellSize * 0.6;
  const carrySize = cellSize * 0.8;
  const carryFontSize = carrySize * 0.5;
  
  const handleResizeStop = (e: any, data: any) => {
    setSize({ width: data.size.width, height: data.size.height });
    triggerUpdate();
  }

  const getCellId = (row: number, col: number) => `sub-${initialState.id}-r${row}-c${col}`;

  const focusNextCell = (currentRow: number, currentCol: number, value: string) => {
    // If minuend and value is only '1', don't jump yet, wait for second digit.
    if (currentRow === 0 && value === '1') {
        return;
    }

    let nextRow = currentRow;
    let nextCol = currentCol - 1;

    // End of row, move to next row
    if (nextCol < 0) {
      nextRow = currentRow + 1;
      nextCol = numCols - 1;
    }
    
    // Check if next row is valid (top, bottom, or result)
    const totalRows = 3;
    if (nextRow < totalRows) {
        const nextCellId = getCellId(nextRow, nextCol);
        document.getElementById(nextCellId)?.focus();
    } else {
        // After result row, focus on first cell of minuend
        const firstCellId = getCellId(0, numCols - 1);
        document.getElementById(firstCellId)?.focus();
    }
  };

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
        minConstraints={[300, 250]}
        maxConstraints={[800, 600]}
        handle={<span className="react-resizable-handle absolute bottom-1 right-1 w-5 h-5 bg-slate-400 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity" />}
    >
    <Card
      className="w-full h-full p-4 bg-white/95 backdrop-blur-sm rounded-lg flex items-start gap-2 select-none border border-transparent group-hover:shadow-lg group-hover:border-slate-300 transition-all"
    >
      <div
        className="flex items-center h-full cursor-grab pt-16 pr-1 self-stretch opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Déplacer le widget"
      >
        <GripVertical className="h-6 w-6 text-slate-400" />
      </div>

      <div className="flex flex-col items-center flex-grow h-full justify-center">
        <div className="flex items-start">
          <div className="flex flex-col items-center m-1">
            <div style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}} />
            {/* Top operand */}
            <div style={{height: cellSize}} /> 
             {/* Bottom operand */}
            <div className="flex items-center justify-center" style={{height: cellSize}}>
                <span className="text-slate-500 font-light" style={{fontSize: `${fontSize}px`}}>-</span>
            </div>
            <div className="my-1" style={{ height: '2px', width: '100%', opacity: 0 }} />
            {/* Result */}
            <div style={{height: cellSize}} />
          </div>

          {colsLeftToRight.map((colFromRight) => {
            const borderColor = getBorderColor(colFromRight);
            return (
              <div key={colFromRight} className="flex flex-col items-center m-1">
                <div className="flex items-center justify-center" style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}}>
                  <CarryCell borderColor={borderColor} size={carrySize} fontSize={carryFontSize} borderStyle="dotted" />
                </div>
                {/* Top operand (Minuend) */}
                <div className="flex items-center" style={{height: cellSize}}>
                    <CalcCell 
                        id={getCellId(0, colFromRight)}
                        borderColor={borderColor} 
                        size={cellSize} 
                        fontSize={fontSize} 
                        allowCrossing={true} 
                        onFilled={(value) => focusNextCell(0, colFromRight, value)}
                        isMinuend={true}
                    />
                </div>
                {/* Bottom operand (Subtrahend) */}
                <div className="flex items-center" style={{height: cellSize}}>
                    <CalcCell 
                        id={getCellId(1, colFromRight)}
                        borderColor={borderColor} 
                        size={cellSize} 
                        fontSize={fontSize} 
                        onFilled={(value) => focusNextCell(1, colFromRight, value)}
                    />
                </div>
                {/* Equals line */}
                <div className="bg-slate-800 my-1" style={{height: '2px', width: '100%'}} />
                {/* Result */}
                <div style={{height: cellSize}}>
                  <CalcCell 
                    id={getCellId(2, colFromRight)}
                    borderColor={borderColor} 
                    size={cellSize} 
                    fontSize={fontSize} 
                    onFilled={(value) => focusNextCell(2, colFromRight, value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center w-full mt-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2} aria-label="Retirer une colonne">
            <ChevronLeft />
          </Button>

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
