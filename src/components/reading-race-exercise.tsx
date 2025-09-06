
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Mic } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

// Sample texts for the exercise
const readingTexts = [
    {
        level: 'CP',
        title: 'Le chat et le soleil',
        text: "Le chat est sur le mur. Il voit le soleil. Le chat aime le soleil. Il fait une sieste."
    },
    {
        level: 'CE1',
        title: 'La petite graine',
        text: "Une petite graine est tombée dans le jardin. La pluie est venue, puis le soleil a brillé. La graine a commencé à pousser. Une jolie fleur est apparue."
    },
    {
        level: 'CE2',
        title: 'Le voyage de la goutte d\'eau',
        text: "Je suis une petite goutte d'eau. Je vis dans un grand nuage avec des millions d'amies. Quand le nuage devient trop lourd, nous tombons sur la terre. C'est ce qu'on appelle la pluie. Notre voyage nous amène dans les rivières, puis jusqu'à la mer. Le soleil nous chauffe et nous remontons dans le ciel. Le voyage recommence !"
    }
];

type ExerciseState = 'selecting' | 'ready' | 'racing' | 'finished';

export function ReadingRaceExercise() {
  const [selectedText, setSelectedText] = useState<(typeof readingTexts)[0] | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('selecting');
  
  const handleSelectText = (text: (typeof readingTexts)[0]) => {
    setSelectedText(text);
    setExerciseState('ready');
  };

  const startRace = () => {
    setExerciseState('racing');
    // Logic to start speech recognition will go here
  };
  
  const resetExercise = () => {
      setSelectedText(null);
      setExerciseState('selecting');
  }

  // Initial screen: text selection
  if (exerciseState === 'selecting' || !selectedText) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Choisis ton texte</CardTitle>
          <CardDescription className="text-center">Choisis un texte pour commencer la course de lecture.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {readingTexts.map((item, index) => (
            <Button key={index} onClick={() => handleSelectText(item)} variant="outline" size="lg" className="h-auto py-3">
              <div className='flex flex-col'>
                <span className='font-bold text-base'>{item.level}</span>
                <span className='font-normal text-lg'>{item.title}</span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  // Pre-race screen
  if (exerciseState === 'ready') {
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">{selectedText.title}</CardTitle>
                <CardDescription className="text-center">Prépare-toi à lire le texte suivant à voix haute.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg p-4 bg-muted/50 rounded-lg">{selectedText.text}</p>
                <div className='text-center'>
                    <Button onClick={startRace} size="lg">
                        <Mic className="mr-2" />
                        Je suis prêt à commencer !
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  // TODO: Add 'racing' and 'finished' states UI
  return (
    <Card>
      <CardContent className="p-6">
        <p>L'exercice de course a commencé !</p>
        <p className="font-bold my-4">{selectedText.text}</p>
        <Button onClick={resetExercise}>Recommencer</Button>
      </CardContent>
    </Card>
  );
}
