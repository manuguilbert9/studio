
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface NumberLevelSettingsType {
  difficulty: number;
}

interface NumberLevelSettingsProps {
  onStart: (settings: NumberLevelSettingsType) => void;
}

const difficultyMap = {
    0: { label: "Niveau A", range: "0 à 20", description: "Les nombres de base, sans complexité." },
    1: { label: "Niveau B", range: "0 à 69", description: "Nombres courants avant les premières exceptions." },
    2: { label: "Niveau C", range: "70 à 9 999", description: "Inclut les nombres complexes (70, 90) et les centaines/milliers." },
    3: { label: "Niveau D", range: "1 000 à 9 999 999", description: "Grands nombres, milliers et millions, avec plusieurs zéros." }
}

export function NumberLevelSettings({ onStart }: NumberLevelSettingsProps) {
  const [difficulty, setDifficulty] = useState(0);

  const handleSubmit = () => {
    onStart({ difficulty });
  };
  
  const currentLevel = difficultyMap[difficulty as keyof typeof difficultyMap];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice de lecture</CardTitle>
        <CardDescription className="text-center">Choisis ton niveau de difficulté pour l'exercice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        <div className="space-y-4">
          <Label htmlFor="difficulty-slider" className="text-lg flex justify-between">
            <span>Niveau de difficulté</span>
            <span className="font-bold">{currentLevel.label} ({currentLevel.range})</span>
          </Label>
          <Slider
            id="difficulty-slider"
            min={0}
            max={3}
            step={1}
            value={[difficulty]}
            onValueChange={(value) => setDifficulty(value[0])}
          />
          <p className="text-center text-muted-foreground min-h-[40px]">{currentLevel.description}</p>
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
