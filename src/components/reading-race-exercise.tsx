
'use client';

import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Mic, MicOff, Flag, Repeat, ArrowLeft } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { readingTexts, ReadingText } from '@/lib/reading-texts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

type ExerciseState = 'selecting' | 'ready' | 'racing' | 'finished';

export function ReadingRaceExercise() {
  const { student } = useContext(UserContext);
  const [selectedText, setSelectedText] = useState<ReadingText | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('selecting');
  
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [finalWPM, setFinalWPM] = useState(0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);

  const textToDisplay = useMemo(() => {
    if (!selectedText) return '';
    return selectedText.level === 'Niveau A' ? selectedText.text.toUpperCase() : selectedText.text;
  }, [selectedText]);

  // Words with punctuation for display
  const wordsWithPunctuation = useMemo(() => {
    if (!selectedText) return [];
    return textToDisplay.split(/\s+/);
  }, [textToDisplay, selectedText]);
  
  // Words without punctuation for comparison
  const textWordsForComparison = useMemo(() => {
    return selectedText?.text.toLowerCase().replace(/[.,]/g, '').split(/\s+/) || [];
  }, [selectedText]);
  
  // Spoken words without punctuation for comparison
  const spokenWordsForComparison = useMemo(() => {
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
  
  const stopRace = useCallback(() => {
    stopListening();
    const correctWordsCount = spokenWordsForComparison.filter((word, index) => textWordsForComparison[index] && word === textWordsForComparison[index]).length;
    const wpm = timeElapsed > 0 ? Math.round((correctWordsCount / timeElapsed) * 60) : 0;
    
    const mistakes = textWordsForComparison.reduce((acc: string[], expectedWord, index) => {
        const spokenWord = spokenWordsForComparison[index];
        if (!spokenWord || spokenWord !== expectedWord) {
            acc.push(expectedWord);
        }
        return acc;
    }, []);

    const details: ScoreDetail[] = [{
        question: selectedText?.title || 'Course de lecture',
        userAnswer: transcript,
        correctAnswer: selectedText?.text || '',
        status: 'completed',
        mistakes: mistakes,
    }];
    setSessionDetails(details);

    setFinalWPM(wpm);
    setExerciseState('finished');
  }, [stopListening, timeElapsed, spokenWordsForComparison, textWordsForComparison, selectedText]);

   useEffect(() => {
      const saveResult = async () => {
          if (exerciseState === 'finished' && student && !hasBeenSaved) {
              setHasBeenSaved(true);
              await addScore({
                  userId: student.id,
                  skill: 'reading-race',
                  score: finalWPM,
                  details: sessionDetails,
              });
          }
      };
      saveResult();
   }, [exerciseState, student, finalWPM, hasBeenSaved, sessionDetails]);
  
  useEffect(() => {
      if (!selectedText || exerciseState !== 'racing') return;
      
      if (spokenWordsForComparison.length >= textWordsForComparison.length) {
          const allCorrect = textWordsForComparison.every((word, index) => word === spokenWordsForComparison[index]);
          if(allCorrect) {
            stopRace();
          }
      }
  }, [transcript, selectedText, stopRace, exerciseState, spokenWordsForComparison, textWordsForComparison]);

  
  const handleSelectText = (text: ReadingText) => {
    setSelectedText(text);
    setExerciseState('ready');
  };

  const startRace = () => {
    setTranscript('');
    setTimeElapsed(0);
    setError(null);
    setFinalWPM(0);
    setHasBeenSaved(false);
    setSessionDetails([]);
    setExerciseState('racing');
    startListening();
  };
  
  const resetExercise = () => {
    stopListening();
    setSelectedText(null);
    setExerciseState('selecting');
    setTranscript('');
    setTimeElapsed(0);
    setHasBeenSaved(false);
  };

  const tryAgain = () => {
    stopListening();
    setTranscript('');
    setTimeElapsed(0);
    setFinalWPM(0);
    setHasBeenSaved(false);
    setExerciseState('ready');
  }

  const textsByLevel = useMemo(() => {
    const grouped: Record<string, ReadingText[]> = {};
    readingTexts.forEach(text => {
        if (!grouped[text.level]) {
            grouped[text.level] = [];
        }
        grouped[text.level].push(text);
    });
    return grouped;
  }, []);

  // --- Render Logic ---

  if (exerciseState === 'selecting' || !selectedText) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Choisis ton texte</CardTitle>
          <CardDescription className="text-center">Choisis un texte pour commencer la course de lecture.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
                {Object.entries(textsByLevel).map(([level, texts]) => (
                     <AccordionItem value={level} key={level}>
                        <AccordionTrigger className="text-xl font-semibold">{level}</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2">
                             {texts.map((item, index) => (
                                <Button key={index} onClick={() => handleSelectText(item)} variant="outline" size="lg" className="h-auto py-3 justify-start">
                                    <span className='font-normal text-lg'>{item.title}</span>
                                </Button>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
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
                <p className="text-lg p-4 bg-muted/50 rounded-lg">{textToDisplay}</p>
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
      const correctWordsCount = spokenWordsForComparison.filter((word, index) => textWordsForComparison[index] && word === textWordsForComparison[index]).length;
      const progress = textWordsForComparison.length > 0 ? (correctWordsCount / textWordsForComparison.length) * 100 : 0;
      
      return (
         <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">{selectedText.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-2xl p-4 bg-muted/50 rounded-lg leading-relaxed">
                    {wordsWithPunctuation.map((displayWord, index) => {
                        const comparisonWord = textWordsForComparison[index];
                        const spokenWord = spokenWordsForComparison[index];
                        
                        let status: 'correct' | 'incorrect' | 'pending' = 'pending';
                        if (spokenWord) {
                            status = spokenWord === comparisonWord ? 'correct' : 'incorrect';
                        }
                        
                        return (
                            <span key={index} className={cn(
                                status === 'correct' && "text-green-600 font-bold",
                                status === 'incorrect' && "text-red-500 font-bold line-through"
                            )}>
                                {displayWord}{' '}
                            </span>
                        )
                    })}
                </p>
                <div className="flex items-center justify-center gap-4">
                     <Button onClick={stopRace} size="lg" variant="destructive">
                        <Flag className="mr-2" />
                        J'ai terminé !
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
      const mistakes = sessionDetails[0]?.mistakes || [];

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
                        <CardDescription>Mots Correctement Lus / Minute</CardDescription>
                        <p className="text-3xl font-bold">{finalWPM} <span className="text-lg">MCLM</span></p>
                    </Card>
                </div>
                {mistakes.length > 0 && (
                    <Card className="p-4">
                         <CardDescription>Mots à revoir</CardDescription>
                         <p className="text-lg font-semibold text-destructive mt-2">{mistakes.join(', ')}</p>
                    </Card>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
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
