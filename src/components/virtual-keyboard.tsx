
'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  numericOnly?: boolean;
}

const keyboardLayout = [
  ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['W', 'X', 'C', 'V', 'B', 'N', '⌫'],
];

const numericLayout = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '⌫']
]

export function VirtualKeyboard({ onKeyPress, numericOnly = false }: VirtualKeyboardProps) {
    const layout = numericOnly ? numericLayout : keyboardLayout;
  return (
    <div className="w-full bg-muted p-4 rounded-lg shadow-inner">
      <div className="flex flex-col items-center justify-center gap-2">
        {layout.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-2">
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => onKeyPress(key)}
                variant="outline"
                className={cn(
                    "h-14 text-xl font-bold bg-background shadow-md transform active:scale-95 active:bg-accent",
                    key.length > 1 ? 'w-20' : 'w-14'
                )}
              >
                {key === '⌫' ? <Delete /> : key}
              </Button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
