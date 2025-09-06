
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Mic, MicOff, Flag, Repeat, ArrowLeft } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

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
  
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const textWords = useMemo(() => selectedText?.text.toLowerCase().replace(/[.,]/g, '').split(/\s+/) || [], [selectedText]);
  
  const wordsRead = useMemo(() => {
    return transcript.toLowerCase().replace(/[.,]/g, '').split(/\s+/).filter(Boolean);
  }, [transcript]);

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
      onResult: (result) => {
          setTranscript(prev => `${prev} ${result}`.trim());
      },
      onError: (err) => {
        if (err === 'not-allowed' || err === 'service-not-allowed') {
            setError("L'accès au microphone est bloqué. Veuillez l'autoriser dans les paramètres de votre navigateur.");
        } else {
            setError("Une erreur de reconnaissance vocale est survenue.");
        }
      }
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (exerciseState === 'racing' && isListening) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [exerciseState, isListening]);
  
  useEffect(() => {
      // Check if all words are read correctly
      if (textWords.length > 0 && wordsRead.length >= textWords.length) {
          const allCorrect = textWords.every((word, index) => word === wordsRead[index]);
          if (allCorrect) {
              stopListening();
              setExerciseState('finished');
          }
      }
  }, [wordsRead, textWords, stopListening]);

  
  const handleSelectText = (text: (typeof readingTexts)[0]) => {
    setSelectedText(text);
    setExerciseState('ready');
  };

  const startRace = () => {
    setTranscript('');
    setTimeElapsed(0);
    setError(null);
    setExerciseState('racing');
    startListening();
  };
  
  const resetExercise = () => {
    stopListening();
    setSelectedText(null);
    setExerciseState('selecting');
    setTranscript('');
    setTimeElapsed(0);
  };

  const tryAgain = () => {
    stopListening();
    setTranscript('');
    setTimeElapsed(0);
    setExerciseState('ready');
  }

  // --- Render Logic ---

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
  
  if (exerciseState === 'ready') {
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">{selectedText.title}</CardTitle>
                <CardDescription className="text-center">Prépare-toi à lire le texte suivant à voix haute.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg p-4 bg-muted/50 rounded-lg">{selectedText.text}</p>
                 {!isSupported ? (
                    <p className="text-center text-destructive font-semibold">Désolé, la reconnaissance vocale n'est pas supportée par votre navigateur.</p>
                 ) : (
                    <div className='text-center'>
                        <Button onClick={startRace} size="lg">
                            <Mic className="mr-2" />
                            Je suis prêt à commencer !
                        </Button>
                    </div>
                )}
            </CardContent>
             <CardFooter>
                <Button onClick={resetExercise} variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Choisir un autre texte
                </Button>
            </CardFooter>
        </Card>
    )
  }
  
  if (exerciseState === 'racing') {
      const progress = textWords.length > 0 ? (wordsRead.length / textWords.length) * 100 : 0;
      return (
         <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">{selectedText.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-2xl p-4 bg-muted/50 rounded-lg leading-relaxed">
                    {textWords.map((word, index) => {
                        const spokenWord = wordsRead[index];
                        let status: 'correct' | 'incorrect' | 'pending' = 'pending';
                        if (spokenWord) {
                            status = spokenWord === word ? 'correct' : 'incorrect';
                        }
                        return (
                            <span key={index} className={cn(
                                status === 'correct' && "text-green-600 font-bold",
                                status === 'incorrect' && "text-red-500 font-bold line-through"
                            )}>
                                {word}{' '}
                            </span>
                        )
                    })}
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Button onClick={isListening ? stopListening : startListening} size="lg" variant={isListening ? 'destructive' : 'default'}>
                        {isListening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
                        {isListening ? 'Arrêter' : 'Reprendre'}
                    </Button>
                </div>
                 {error && <p className="text-center text-destructive font-semibold">{error}</p>}
                
                <Progress value={progress} className="h-4" />

                <div className="font-mono text-center text-lg">Temps : {timeElapsed}s</div>

            </CardContent>
         </Card>
      )
  }

  if (exerciseState === 'finished') {
      const wordsPerMinute = timeElapsed > 0 ? Math.round((textWords.length / timeElapsed) * 60) : 0;
      const mistakes = wordsRead.filter((word, index) => textWords[index] && word !== textWords[index]);

      return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl text-center">
            <CardHeader>
                <CardTitle className="font-headline text-4xl mb-2">Course terminée !</CardTitle>
                <Flag className="h-10 w-10 mx-auto text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                        <CardDescription>Temps total</CardDescription>
                        <p className="text-3xl font-bold">{timeElapsed}s</p>
                    </Card>
                     <Card className="p-4">
                        <CardDescription>Mots par minute</CardDescription>
                        <p className="text-3xl font-bold">{wordsPerMinute}</p>
                    </Card>
                </div>
                {mistakes.length > 0 && (
                    <Card className="p-4">
                         <CardDescription>Mots à revoir</CardDescription>
                         <p className="text-lg font-semibold text-destructive mt-2">{mistakes.join(', ')}</p>
                    </Card>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                 <Button onClick={tryAgain} size="lg">
                    <Repeat className="mr-2" />
                    Recommencer la même course
                </Button>
                 <Button onClick={resetExercise} variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Choisir un autre texte
                </Button>
            </CardFooter>
        </Card>
      )
  }

  return null;
}
