

'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { AdditionIcon } from '@/components/icons/addition-icon';
import { SoustractionIcon } from '@/components/icons/soustraction-icon';

interface CalculWidgetSelectProps {
    onAddAddition: () => void;
    onAddSoustraction: () => void;
}

export function CalculWidgetSelect({ onAddAddition, onAddSoustraction }: CalculWidgetSelectProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="sm">
                    <Calculator className="h-4 w-4 mr-2" /> Calculs
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={onAddAddition}>
                    <AdditionIcon className="h-4 w-4 mr-2" />
                    <span>Addition posée</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddSoustraction}>
                    <SoustractionIcon className="h-4 w-4 mr-2" />
                    <span>Soustraction posée</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
