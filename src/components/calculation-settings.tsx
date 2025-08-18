'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { CalculationSettings as CalcSettings } from '@/lib/questions';

interface CalculationSettingsProps {
  onStart: (settings: CalcSettings) => void;
}

const operationsDesc = [
  "Additions simples",
  "Additions & Soustractions",
  "..., et Multiplications",
  "..., et Divisions",
  "Toutes opérations"
];

const numberSizeDesc = [
  "Nombres de 0 à 10",
  "Nombres de 0 à 20",
  "Nombres de 0 à 100",
  "Nombres de 0 à 500",
  "Nombres de 0 à 1000"
];

const complexityDesc = [
  "Calcul direct",
  "Calcul avec retenue",
  "Problème à deux étapes",
  "Problème écrit simple",
  "Problème écrit complexe"
];

export function CalculationSettings({ onStart }: CalculationSettingsProps) {
  const [operations, setOperations] = useState(0);
  const [numberSize, setNumberSize] = useState(0);
  const [complexity, setComplexity] = useState(0);

  const handleSubmit = () => {
    onStart({
      operations,
      numberSize,
      complexity,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice de calcul</CardTitle>
        <CardDescription className="text-center">Choisis le niveau de difficulté pour chaque catégorie.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        <div className="space-y-4">
          <Label htmlFor="operations" className="text-lg">Types d'opérations</Label>
          <Slider
            id="operations"
            min={0}
            max={4}
            step={1}
            value={[operations]}
            onValueChange={(value) => setOperations(value[0])}
          />
          <p className="text-center text-muted-foreground font-medium">{operationsDesc[operations]}</p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="numberSize" className="text-lg">Taille des nombres</Label>
          <Slider
            id="numberSize"
            min={0}
            max={4}
            step={1}
            value={[numberSize]}
            onValueChange={(value) => setNumberSize(value[0])}
          />
           <p className="text-center text-muted-foreground font-medium">{numberSizeDesc[numberSize]}</p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="complexity" className="text-lg">Complexité cognitive</Label>
          <Slider
            id="complexity"
            min={0}
            max={4}
            step={1}
            value={[complexity]}
            onValueChange={(value) => setComplexity(value[0])}
             disabled // TODO: Implement cognitive complexity logic in question generation
          />
           <p className="text-center text-muted-foreground font-medium">{complexityDesc[complexity]} {complexity === 4 ? '(Bientôt disponible)' : ''}</p>
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
