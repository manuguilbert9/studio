
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { type CalculationState } from '@/services/scores';

interface AdditionWidgetProps {
  isExercise: boolean;
  operands?: number[];
  calculationState?: CalculationState;
  onInputChange?: (id: string, value: string) => void;
  onToggleCrossed?: (id: string) => void;
  feedback?: 'correct' | 'incorrect' | null;
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

export function AdditionWidget({ 
    isExercise,
    operands = [0, 0],
    calculationState = {},
    onInputChange = () => {},
    onToggleCrossed = () => {},
    feedback = null,
}: AdditionWidgetProps) {
  const numOperands = operands.length;
  const numCols = String(Math.max(...operands)).length;

  const colsToRender = React.useMemo(
    () => Array.from({ length: numCols }, (_, i) => i),
    [numCols]
  );
  
  const cellSize = 60;
  const fontSize = cellSize * 0.6;
  const carrySize = cellSize * 0.8;
  const carryFontSize = carrySize * 0.5;

  const getTabIndex = (row: number, col: number) => {
    const totalCols = numCols + 1;
    const tabCol = (totalCols - 1) - col;
    return row * totalCols + tabCol + 1;
  };

  return (
    <div style={{ width: (numCols + 2) * (cellSize + 8), height: (numOperands + 2) * (cellSize + 8) }}>
    <Card className="w-full h-full p-4 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center select-none">
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
            <div className="my-1" style={{ height: '2px', width: '100%', opacity: 0 }} />
            <div style={{height: cellSize}} />
          </div>

          <div className="flex flex-col items-center m-1">
             <div style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}} />
            {[...Array(numOperands)].map((_, i) => (
              <div key={i} style={{width: cellSize, height: cellSize}} />
            ))}
            <div className="bg-slate-800 my-1" style={{height: '2px', width: '100%'}} />
            <div style={{height: cellSize}}>
              <CalcCell 
                id={`result-${numCols}`}
                borderColor={getBorderColor(numCols)} 
                size={cellSize} 
                fontSize={fontSize}
                tabIndex={getTabIndex(numOperands, 0)}
                value={calculationState?.[`result-${numCols}`]?.value}
                onValueChange={onInputChange}
                isReadOnly={!!feedback}
              />
            </div>
          </div>

          {colsToRender.map((col) => {
            const colFromRight = numCols - 1 - col;
            const borderColor = getBorderColor(colFromRight);
            return (
              <div key={col} className="flex flex-col items-center m-1">
                <div className="flex items-center justify-center" style={{width: cellSize, height: cellSize * 0.8, marginBottom: '0.25rem'}}>
                  {colFromRight > 0 && <CarryCell 
                    id={`carry-${colFromRight}`}
                    borderColor={borderColor} 
                    size={carrySize} 
                    fontSize={carryFontSize} 
                    value={calculationState?.[`carry-${colFromRight}`]?.value}
                    onValueChange={onInputChange}
                    isReadOnly={!!feedback}
                  />}
                </div>

                {[...Array(numOperands)].map((_, rowIndex) => (
                    <div key={rowIndex} className="flex items-center" style={{height: cellSize}}>
                        <CalcCell 
                            id={`op-${rowIndex}-${colFromRight}`}
                            borderColor={borderColor} 
                            size={cellSize} 
                            fontSize={fontSize} 
                            tabIndex={getTabIndex(rowIndex, col + 1)}
                            value={calculationState?.[`op-${rowIndex}-${colFromRight}`]?.value}
                            onValueChange={onInputChange}
                            isReadOnly={!!feedback}
                        />
                    </div>
                ))}

                <div className="bg-slate-800 my-1" style={{height: '2px', width: '100%'}} />

                <div style={{height: cellSize}}>
                  <CalcCell 
                    id={`result-${colFromRight}`}
                    borderColor={borderColor} 
                    size={cellSize} 
                    fontSize={fontSize}
                    tabIndex={getTabIndex(numOperands, col + 1)}
                    value={calculationState?.[`result-${colFromRight}`]?.value}
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
