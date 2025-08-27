'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalcCell } from './calc-cell';
import { CarryCell } from './carry-cell';
import { Button } from '@/components/ui/button';

interface AdditionWidgetProps {
  onClose: () => void;
}

const initialPosition = { x: 200, y: 100 };

// Couleurs par colonne vue "depuis la droite"
const colors = [
  'border-blue-500',  // 0 -> Unités (droite)
  'border-red-500',   // 1 -> Dizaines
  'border-green-500', // 2 -> Centaines
  'border-slate-900', // 3 -> Milliers (noir)
];

const getBorderColor = (colIndexFromRight: number) =>
  colors[colIndexFromRight] || 'border-slate-900';

export function AdditionWidget({ onClose }: AdditionWidgetProps) {
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return initialPosition;
    return { x: window.innerWidth / 2 - 200, y: 100 };
  });

  const [numOperands, setNumOperands] = useState(2);
  const [numCols, setNumCols] = useState(3); // centaines, dizaines, unités

  // ---- Drag uniquement sur la poignée
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const addOperand = () => setNumOperands(c => Math.min(c + 1, 3));
  const expandCols = () => setNumCols(c => Math.min(c + 1, 4)); // max milliers
  const shrinkCols = () => setNumCols(c => Math.max(c - 1, 2)); // min dizaines

  // Ordre d'affichage visuel: gauche -> droite (centaines -> unités)
  const colsLeftToRight = React.useMemo(
    () => Array.from({ length: numCols }, (_, i) => numCols - 1 - i),
    [numCols]
  );

  return (
    <Card
      className="absolute z-30 p-4 shadow-2xl bg-white/95 backdrop-blur-sm rounded-lg flex items-start gap-2 select-none"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
    >
      {/* Poignée */}
      <div
        onMouseDown={onHandleMouseDown}
        className="flex items-center h-full cursor-grab pt-16 pr-1"
        aria-label="Déplacer le widget"
      >
        <GripVertical className="h-6 w-6 text-slate-400" />
      </div>

      <div className="flex flex-col items-center">
        {/* Bloc principal */}
        <div className="flex items-start">
          {/* Gouttière du signe + à GAUCHE */}
          <div className="flex flex-col items-center m-1">
            <div className="w-6 h-10 mb-1" />
            {[...Array(numOperands)].map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center h-12 justify-center w-6">
                {/* Place le + sur la DERNIÈRE ligne d'opérande */}
                {rowIndex === numOperands - 1 ? (
                  <span className="text-slate-500 text-3xl font-light">+</span>
                ) : null}
              </div>
            ))}
            <div className="h-0.5 my-1 w-6 opacity-0" />
            <div className="h-12 w-6" />
          </div>

          {/* RETENUE FINALE (case noire) A GAUCHE DES COLONNES */}
          <div className="flex flex-col items-center m-1">
            <div className="w-12 h-10 mb-1" />
            {[...Array(numOperands)].map((_, i) => (
              <div key={i} className="w-12 h-12" />
            ))}
            <div className="h-0.5 bg-slate-800 my-1 w-12" />
            <div className="h-12">
              <CalcCell borderColor={getBorderColor(numCols)} />
            </div>
          </div>

          {/* Colonnes de calcul (centaines -> dizaines -> unités) */}
          {colsLeftToRight.map((colFromRight) => {
            const borderColor = getBorderColor(colFromRight);
            return (
              <div key={colFromRight} className="flex flex-col items-center m-1">
                {/* Retenue (pas pour unités) */}
                <div className="w-12 h-10 mb-1 flex items-center justify-center">
                  {colFromRight > 0 && <CarryCell borderColor={borderColor} />}
                </div>

                {/* Opérandes */}
                {[...Array(numOperands)].map((_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center h-12">
                    <CalcCell borderColor={borderColor} />
                  </div>
                ))}

                {/* Barre de résultat */}
                <div className="h-0.5 bg-slate-800 my-1 w-12" />

                {/* Résultat */}
                <div className="h-12">
                  <CalcCell borderColor={borderColor} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles (inversés) */}
        <div className="flex justify-between items-center w-full mt-2 px-4">
          {/* <  = étendre */}
          <Button onClick={expandCols} size="icon" variant="ghost" disabled={numCols >= 4} aria-label="Ajouter une colonne">
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

          {/* >  = réduire */}
          <Button onClick={shrinkCols} size="icon" variant="ghost" disabled={numCols <= 2} aria-label="Retirer une colonne">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 bg-slate-600 text-white rounded-full p-1.5 hover:bg-slate-800"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" />
      </button>
    </Card>
  );
}
