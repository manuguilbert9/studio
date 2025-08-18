
'use client';

import { Tag } from "lucide-react";

interface PriceTagProps {
    price: string;
}

export function PriceTag({ price }: PriceTagProps) {
    return (
        <div className="relative inline-block bg-primary text-primary-foreground rounded-lg shadow-md my-2">
            <div className="flex items-center px-4 py-2">
                <Tag className="w-5 h-5 mr-2" />
                <span className="font-bold text-xl font-numbers">{price}</span>
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full transform -translate-x-1/2 border-4 border-background"></div>
        </div>
    );
}
