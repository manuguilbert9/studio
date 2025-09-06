
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface CountSettingsType {
  maxNumber: number;
}

interface CountSettingsProps {
  onStart: (settings: CountSettingsType) => void;
}

export function CountSettings({ onStart }: CountSettingsProps) {
  const [maxNumber, setMaxNumber] = useState(10);

  const handleSubmit = () => {
    onStart({ maxNumber });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice de dénombrement</CardTitle>
        <CardDescription className="text-center">Choisis le nombre maximum d'objets à compter.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        <div className="space-y-4">
          <Label htmlFor="max-number-slider" className="text-lg">Nombre maximum</Label>
          <Slider
            id="max-number-slider"
            min={5}
            max={30}
            step={1}
            value={[maxNumber]}
            onValueChange={(value) => setMaxNumber(value[0])}
          />
          <p className="text-center text-muted-foreground font-medium text-2xl font-numbers">{maxNumber}</p>
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
