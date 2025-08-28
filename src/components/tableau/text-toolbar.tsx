
'use client';

import { Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextToolbarProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  setColor: (color: string) => void;
  toggleUnderline: () => void;
}

const colors = [
    { name: 'Noir', class: 'text-slate-900', bg: 'bg-slate-900' },
    { name: 'Rouge', class: 'text-red-600', bg: 'bg-red-600' },
    { name: 'Vert', class: 'text-green-600', bg: 'bg-green-600' },
    { name: 'Bleu', class: 'text-blue-600', bg: 'bg-blue-600' },
]

export function TextToolbar({ fontSize, setFontSize, setColor, toggleUnderline }: TextToolbarProps) {
  return (
    <div className="flex items-center justify-start gap-2 p-1 rounded-md ml-2">
        <div className="flex items-center gap-1">
            <Label htmlFor="font-size" className="sr-only">Taille de la police</Label>
            <Input 
                id="font-size"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 h-8 text-sm"
                min={8}
                max={128}
            />
        </div>
        
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
