
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { CurrencySettings as CurrSettings } from '@/lib/questions';

interface CurrencySettingsProps {
  onStart: (settings: CurrSettings) => void;
}

const difficultyDesc = [
  "Reconnaissance et association simple",
  "Comptage sans conversion compliquée",
  "Composition et décomposition simple",
  "Transactions avec rendu de monnaie",
];

export function CurrencySettings({ onStart }: CurrencySettingsProps) {
  const [difficulty, setDifficulty] = useState(0);

  const handleSubmit = () => {
    onStart({
      difficulty,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice sur la monnaie</CardTitle>
        <CardDescription className="text-center">Choisis le niveau de difficulté de l'exercice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        <div className="space-y-4">
          <Label htmlFor="difficulty" className="text-lg">Niveau de Difficulté</Label>
          <Slider
            id="difficulty"
            min={0}
            max={3}
            step={1}
            value={[difficulty]}
            onValueChange={(value) => setDifficulty(value[0])}
          />
          <p className="text-center text-muted-foreground font-medium">{difficultyDesc[difficulty]}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} size="lg" className="w-full text-xl py-7">
          Commencer l'exercice !
        </Button>
      </CardFooter>
    </Card>
  );
}
