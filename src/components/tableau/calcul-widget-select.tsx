
'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator } from 'lucide-react';

interface CalculWidgetSelectProps {
    onAddAddition: () => void;
    onAddSoustraction: () => void;
}

export function CalculWidgetSelect({ onAddAddition, onAddSoustraction }: CalculWidgetSelectProps) {
    
    const handleValueChange = (value: string) => {
        if (value === 'addition') {
            onAddAddition();
        } else if (value === 'soustraction') {
            onAddSoustraction();
        }
    };

    return (
        <Select onValueChange={handleValueChange}>
            <SelectTrigger className="w-auto h-9 px-3 gap-2 text-sm">
                <Calculator className="h-4 w-4" />
                <SelectValue placeholder="Calculs" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="addition">Addition posée</SelectItem>
                <SelectItem value="soustraction">Soustraction posée</SelectItem>
            </SelectContent>
        </Select>
    );
}
