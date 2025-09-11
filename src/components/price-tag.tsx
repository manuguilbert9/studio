
import { Tag } from 'lucide-react';

interface PriceTagProps {
  price: string;
}

export function PriceTag({ price }: PriceTagProps) {
  return (
    <div className="relative inline-block bg-primary text-primary-foreground font-bold text-2xl py-2 pl-4 pr-8 rounded-md shadow-md">
      <span>{price}</span>
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary" />
      <div 
        className="absolute -right-5 top-1/2 -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: '25px solid transparent',
          borderBottom: '25px solid transparent',
          borderLeft: '20px solid hsl(var(--primary))',
        }}
      />
    </div>
  );
}
