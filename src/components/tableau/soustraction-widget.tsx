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
  
  // Centralized state for all cell values
  const [grid, setGrid] = useState<string[][]>(() => Array(3).fill(null).map(() => Array(numCols).fill('')));
  const [carries, setCarries] = useState<string[]>(() => Array(numCols).fill(''));


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
  
  const handleCellChange = (row: number, col: number, value: string) => {
    const newGrid = [...grid];
    newGrid[row][col] = value;
    setGrid(newGrid);
  };
  
  const handleCarryChange = (col: number, value: string) => {
    const newCarries = [...carries];
    newCarries[col] = value;
    setCarries(newCarries);
  }

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

  const expandCols = () => {
    if (numCols < 4) {
        setNumCols(c => c + 1);
        setGrid(g => g.map(row => ['', ...row]));
        setCarries(c => ['', ...c]);
    }
  };
  const shrinkCols = () => {
    if (numCols > 2) {
        setNumCols(c => c - 1);
        setGrid(g => g.map(row => row.slice(1)));
        setCarries(c => c.slice(1));
    }
  };

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

  const getCellId = (type: 'minuend' | 'subtrahend' | 'result' | 'carry', colFromRight: number) => {
    return `sub-${initialState.id}-${type}-c${colFromRight}`;
  }

  const focusNextCell = (currentStep: number) => {
      let nextStep = currentStep + 1;

      // Special conditional logic after step 5 (subtrahend units)
      if (currentStep === 5) {
        const minuendUnit = parseInt(grid[0][0] || '0', 10);
        const subtrahendUnit = parseInt(grid[1][0] || '0', 10);

        if (minuendUnit >= subtrahendUnit) {
            document.getElementById(getCellId('result', 0))?.focus(); // Focus #6
        } else {
            document.getElementById(getCellId('carry', 1))?.focus(); // Focus #9
        }
        return; // Stop default flow
      }

      // Default focus flow based on step number
      let idToFocus: string | null = null;
      switch (nextStep) {
          case 1: idToFocus = getCellId('minuend', numCols - 2); break; // Focus #1
          case 2: idToFocus = getCellId('minuend', 0); break;          // Focus #2
          case 3: idToFocus = getCellId('subtrahend', numCols - 1); break; // Focus #3
          case 4: idToFocus = getCellId('subtrahend', numCols - 2); break; // Focus #4
          case 5: idToFocus = getCellId('subtrahend', 0); break;          // Focus #5
      }

      if (idToFocus) {
          document.getElementById(idToFocus)?.focus();
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
            <div style={{height: cellSize}} /> 
            <div className="flex items-center justify-center" style={{height: cellSize}}>
                <span className="text-slate-500 font-light" style={{fontSize: `${fontSize}px`}}>-</span>
            </div>
            <div className="my-1" style={{ height: '2px', width: '100%', opacity: 0 }} />
            <div style={{height: cellSize}} />
          </div>

          {colsLeftToRight.map((colFromRight, index) => {
             const colFromLeft = numCols - 1 - index;
             const borderColor = getBorderColor(colFromRight);
            return (
              <div key={colFromRight} className="flex flex-col items-center m-1">
                <div className="flex items-center justify-center" style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}}>
                  <CarryCell 
                    // Case #9 is carry for tens (colFromRight=1)
                    id={getCellId('carry', colFromRight)}
                    borderColor={borderColor} 
                    size={carrySize} 
                    fontSize={carryFontSize} 
                    borderStyle="dotted" 
                    value={carries[colFromLeft]}
                    onChange={(val) => handleCarryChange(colFromLeft, val)}
                  />
                </div>
                {/* Minuend */}
                <div className="flex items-center" style={{height: cellSize}}>
                    <CalcCell 
                        // Cases 0, 1, 2
                        id={getCellId('minuend', colFromRight)}
                        value={grid[0][colFromLeft]}
                        onChange={(val) => handleCellChange(0, colFromLeft, val)}
                        borderColor={borderColor} 
                        size={cellSize} 
                        fontSize={fontSize} 
                        allowCrossing={true} 
                        onFilled={() => focusNextCell(colFromLeft)}
                        isMinuend={true}
                    />
                </div>
                {/* Subtrahend */}
                <div className="flex items-center" style={{height: cellSize}}>
                    <CalcCell
                        // Cases 3, 4, 5
                        id={getCellId('subtrahend', colFromRight)}
                        value={grid[1][colFromLeft]}
                        onChange={(val) => handleCellChange(1, colFromLeft, val)}
                        borderColor={borderColor} 
                        size={cellSize} 
                        fontSize={fontSize} 
                        onFilled={() => focusNextCell(colFromLeft + numCols)}
                    />
                </div>
                {/* Equals line */}
                <div className="bg-slate-800 my-1" style={{height: '2px', width: '100%'}} />
                {/* Result */}
                <div style={{height: cellSize}}>
                  <CalcCell 
                    // Cases 8, 7, 6
                    id={getCellId('result', colFromRight)}
                    value={grid[2][colFromLeft]}
                    onChange={(val) => handleCellChange(2, colFromLeft, val)}
                    borderColor={borderColor} 
                    size={cellSize} 
                    fontSize={fontSize} 
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
