
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import type { SoustractionWidgetState } from '@/services/tableau.types';
import { cn } from '@/lib/utils';


interface SoustractionWidgetProps {
  initialState: SoustractionWidgetState;
  isExerciseMode: boolean;
  operands: number[];
  exerciseInputs: Record<string, string>;
  onInputChange: (id: string, value: string) => void;
  feedback: 'correct' | 'incorrect' | null;
}

const colors = [
  'border-blue-500',
  'border-red-500',
  'border-green-500',
  'border-slate-900',
];

const getBorderColor = (colIndexFromRight: number) =>
  colors[colIndexFromRight] || 'border-slate-900';

export function SoustractionWidget({ 
    initialState, 
    isExerciseMode,
    operands,
    exerciseInputs,
    onInputChange,
    feedback
}: SoustractionWidgetProps) {
  const { numCols, size } = initialState;

  const colsToRender = React.useMemo(
    () => Array.from({ length: numCols }, (_, i) => i),
    [numCols]
  );
  
  const cellSize = Math.max(20, Math.min(size.width / (numCols + 2), size.height / 5));
  const fontSize = cellSize * 0.6;
  const carrySize = cellSize * 0.8;
  const carryFontSize = carrySize * 0.5;
  
  const getTabIndex = (row: number, col: number): number => {
    const totalCols = numCols;
    if (row === -1) { 
        return (2 * totalCols) + (col - 1) + 1;
    }
    return (row * totalCols) + col + 1;
  };
  
  return (
    <div style={{ width: size.width, height: size.height }}>
    <Card className="w-full h-full p-4 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center select-none">
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

          {colsToRender.map((col) => {
             const colFromRight = numCols - 1 - col;
             const borderColor = getBorderColor(colFromRight);
            return (
              <div key={col} className="flex flex-col items-center m-1">
                <div className="flex items-center justify-center" style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}}>
                  {colFromRight > 0 && (
                    <CarryCell 
                        id={`carry-${colFromRight}`}
                        borderColor={getBorderColor(colFromRight)}
                        size={carrySize} 
                        fontSize={carryFontSize} 
                        borderStyle="dotted"
                        tabIndex={getTabIndex(-1, col)}
                        value={exerciseInputs?.[`carry-${colFromRight}`]}
                        onValueChange={onInputChange}
                        isReadOnly={!!feedback}
                    />
                  )}
                </div>
                <div className="flex items-center" style={{height: cellSize}}>
                    <CalcCell 
                        id={`op-0-${colFromRight}`}
                        borderColor={borderColor} 
                        size={cellSize} 
                        fontSize={fontSize} 
                        allowCrossing={true} 
                        isMinuend={true} 
                        tabIndex={getTabIndex(0, col)} 
                        value={String(operands[0] || '').padStart(numCols, '0')[col]}
                        onValueChange={onInputChange}
                        isReadOnly={true}
                    />
                </div>
                <div className="flex items-center" style={{height: cellSize}}>
                    <CalcCell 
                        id={`op-1-${colFromRight}`}
                        borderColor={borderColor} 
                        size={cellSize} 
                        fontSize={fontSize} 
                        tabIndex={getTabIndex(1, col)}
                        value={String(operands[1] || '').padStart(numCols, '0')[col]}
                        onValueChange={onInputChange}
                        isReadOnly={true}
                    />
                </div>
                <div className="bg-slate-800 my-1" style={{height: '2px', width: '100%'}} />
                <div style={{height: cellSize}}>
                  <CalcCell 
                    id={`result-${colFromRight}`}
                    borderColor={borderColor} 
                    size={cellSize} 
                    fontSize={fontSize} 
                    tabIndex={getTabIndex(2, col)}
                    value={exerciseInputs?.[`result-${colFromRight}`]}
                    onValueChange={onInputChange}
                    isReadOnly={!!feedback}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
    </div>
  );
}
