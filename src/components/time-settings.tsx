
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { TimeSettings as TimeSettingsType } from '@/lib/questions';

interface TimeSettingsProps {
  onStart: (settings: TimeSettingsType) => void;
}

const difficultyDesc = [
  "Niveau 1 : Guidage complet (cercle des minutes et couleurs)",
  "Niveau 2 : Aiguilles en couleur, sans fond coloré",
  "Niveau 3 : Introduction des heures de l'après-midi",
  "Niveau 4 : Maîtrise (sans cercle des minutes)",
];

export function TimeSettings({ onStart }: TimeSettingsProps) {
  const [difficulty, setDifficulty] = useState(0);

  const handleSubmit = () => {
    onStart({
      difficulty,
      // Level 4 (difficulty 3) should not show the minute circle.
      showMinuteCircle: difficulty < 3, 
      // Only level 1 (difficulty 0) has color matching on background and numbers
      matchColors: difficulty === 0, 
      // Level 1 and 2 have colored hands
      coloredHands: difficulty < 2,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice sur l'heure</CardTitle>
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
