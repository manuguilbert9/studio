
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from './ui/input';

export interface NumberRangeSettingsType {
  min: number;
  max: number;
}

interface NumberRangeSettingsProps {
  onStart: (settings: NumberRangeSettingsType) => void;
}

const MIN_VAL = 0;
const MAX_VAL = 100000; // Let's cap at 100,000 for practicality

export function NumberRangeSettings({ onStart }: NumberRangeSettingsProps) {
  const [range, setRange] = useState<[number, number]>([0, 100]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.max(MIN_VAL, Math.min(Number(e.target.value), range[1] -1));
    setRange([newMin, range[1]]);
  }
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.min(MAX_VAL, Math.max(Number(e.target.value), range[0] + 1));
     setRange([range[0], newMax]);
  }

  const handleSubmit = () => {
    onStart({ min: range[0], max: range[1] });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Règle ton exercice de lecture de nombres</CardTitle>
        <CardDescription className="text-center">Choisis l'intervalle des nombres à travailler.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 p-8">
        <div className="space-y-4">
          <Label htmlFor="range-slider" className="text-lg">Intervalle des nombres</Label>
          <Slider
            id="range-slider"
            min={MIN_VAL}
            max={MAX_VAL}
            step={1}
            value={range}
            onValueChange={(value) => setRange(value as [number, number])}
            className="my-6"
          />
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
                 <Label htmlFor="min-input">Minimum</Label>
                 <Input id="min-input" type="number" value={range[0]} onChange={handleMinChange} className="font-numbers"/>
            </div>
             <div className="flex flex-col gap-1">
                 <Label htmlFor="max-input">Maximum</Label>
                 <Input id="max-input" type="number" value={range[1]} onChange={handleMaxChange} className="font-numbers"/>
            </div>
          </div>
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
