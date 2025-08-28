
'use client';

import { AlignCenter, Type, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextToolbarProps {
  setFontSize: (size: string) => void;
  setColor: (color: string) => void;
  toggleUnderline: () => void;
}

const fontSizes = [
    { name: 'S', class: 'text-sm' },
    { name: 'M', class: 'text-base' },
    { name: 'L', class: 'text-lg' },
    { name: 'XL', class: 'text-2xl' },
]

const colors = [
    { name: 'Noir', class: 'text-slate-900', bg: 'bg-slate-900' },
    { name: 'Rouge', class: 'text-red-600', bg: 'bg-red-600' },
    { name: 'Vert', class: 'text-green-600', bg: 'bg-green-600' },
    { name: 'Bleu', class: 'text-blue-600', bg: 'bg-blue-600' },
]

export function TextToolbar({ setFontSize, setColor, toggleUnderline }: TextToolbarProps) {
  return (
    <div className="flex items-center justify-start gap-1 p-1 rounded-md ml-2">
        {fontSizes.map(size => (
             <Button key={size.name} variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => setFontSize(size.class)}>
                {size.name}
            </Button>
        ))}
        
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleUnderline}>
            <Underline className="h-4 w-4" />
        </Button>

        <div className="flex gap-1 ml-2">
            {colors.map(color => (
                <Button 
                    key={color.name}
                    variant="outline"
                    size="icon" 
                    className="w-6 h-6 p-0"
                    onClick={() => setColor(color.class)}
                    aria-label={`Couleur ${color.name}`}
                >
                    <div className={`w-4 h-4 rounded-full ${color.bg}`} />
                </Button>
            ))}
        </div>
    </div>
  );
}
