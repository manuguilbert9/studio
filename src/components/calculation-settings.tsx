
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface CalculationSettings {
  operations: number; // 0 for +, 1 for -, 2 for both
  numberSize: number; // 0-4 for number of digits
  complexity: number; // 0 for no carry, 1 for carry, 2 for both
}

interface CalculationSettingsProps {
  onStart: (settings: CalculationSettings) => void;
}

const operationsDesc = ["Addition", "Soustraction", "Addition & Soustraction"];
const numberSizeDesc = ["Nombres à 1 chiffre", "Nombres à 2 chiffres", "Nombres à 3 chiffres", "Nombres à 4 chiffres", "Nombres à 5 chiffres"];
const complexityDesc = ["Sans retenue", "Avec retenue", "Avec ou sans retenue"];

export function CalculationSettings({ onStart }: CalculationSettingsProps) {
  const [operations, setOperations] = useState(0);
  const [numberSize, setNumberSize] = useState(1);
  const [complexity, setComplexity] = useState(0);

  const handleSubmit = () => {
    onStart({ operations, numberSize, complexity });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice de calcul</CardTitle>
        <CardDescription className="text-center">Choisis les options pour générer des calculs adaptés.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        <div className="space-y-4">
          <Label htmlFor="operations-slider" className="text-lg">Opérations</Label>
          <Slider
            id="operations-slider"
            min={0}
            max={2}
            step={1}
            value={[operations]}
            onValueChange={(value) => setOperations(value[0])}
          />
          <p className="text-center text-muted-foreground font-medium">{operationsDesc[operations]}</p>
        </div>
        <div className="space-y-4">
          <Label htmlFor="number-size-slider" className="text-lg">Taille des nombres</Label>
          <Slider
            id="number-size-slider"
            min={0}
            max={4}
            step={1}
            value={[numberSize]}
            onValueChange={(value) => setNumberSize(value[0])}
          />
          <p className="text-center text-muted-foreground font-medium">{numberSizeDesc[numberSize]}</p>
        </div>
        <div className="space-y-4">
          <Label htmlFor="complexity-slider" className="text-lg">Complexité (Retenues)</Label>
          <Slider
            id="complexity-slider"
            min={0}
            max={2}
            step={1}
            value={[complexity]}
            onValueChange={(value) => setComplexity(value[0])}
          />
           <p className="text-center text-muted-foreground font-medium">{complexityDesc[complexity]}</p>
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
