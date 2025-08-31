import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Sparkles className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-headline font-bold text-foreground tracking-wide">
        Classe Magique
      </h1>
    </div>
  );
}
