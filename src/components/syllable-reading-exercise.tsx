
'use client';

import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Mic, Check, X, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore } from '@/services/scores';
import { generateSyllables } from '@/lib/syllable-generator';
import Confetti from 'react-dom-confetti';
import { ScoreTube } from './score-tube';


const NUM_SYLLABLES = 10;
type ExerciseState = 'ready' | 'listening' | 'checking' | 'finished';

export function SyllableReadingExercise() {
  const { student } = useContext(UserContext);
  const [syllables, setSyllables] = useState<string[]>([]);
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(0);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('ready');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  const { transcript, isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
      onResult: (result) => {
        if(isListening){
            checkAnswer(result);
            stopListening();
        }
      },
      onError: (err) => {
        console.error(err);
        setExerciseState('ready');
      }
  });
  
  useEffect(() => {
    setSyllables(generateSyllables(NUM_SYLLABLES));
  }, []);

  const currentSyllable = useMemo(() => syllables[currentSyllableIndex], [syllables, currentSyllableIndex]);

  const handleNextSyllable = useCallback(() => {
    setShowConfetti(false);
    if (currentSyllableIndex < NUM_SYLLABLES - 1) {
      setCurrentSyllableIndex(prev => prev + 1);
      setFeedback(null);
      setExerciseState('ready');
    } else {
      setExerciseState('finished');
    }
  }, [currentSyllableIndex]);
  
  const checkAnswer = (spokenText: string) => {
    setExerciseState('checking');
    const expected = currentSyllable.toLowerCase().trim();
    const actual = spokenText.toLowerCase().trim();

    if (expected === actual) {
      setFeedback('correct');
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);
    } else {
      setFeedback('incorrect');
    }
    setTimeout(handleNextSyllable, 2000);
  };
  
  const handleMicClick = () => {
    if (!isListening) {
      startListening();
      setExerciseState('listening');
    } else {
      stopListening();
      setExerciseState('ready');
    }
  };

  useEffect(() => {
      const saveResult = async () => {
          if (exerciseState === 'finished' && student && !hasBeenSaved) {
              setHasBeenSaved(true);
              const score = (correctAnswers / NUM_SYLLABLES) * 100;
              await addScore({
                  userId: student.id,
                  skill: 'syllable-reading',
                  score: score,
              });
          }
      };
      saveResult();
   }, [exerciseState, student, correctAnswers, hasBeenSaved]);

  const restartExercise = () => {
    setSyllables(generateSyllables(NUM_SYLLABLES));
    setCurrentSyllableIndex(0);
    setExerciseState('ready');
    setFeedback(null);
    setCorrectAnswers(0);
    setShowConfetti(false);
    setHasBeenSaved(false);
  };
  
  if (!isSupported) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl p-6">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Erreur</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">Désolé, la reconnaissance vocale n'est pas supportée par ce navigateur. Veuillez essayer avec Google Chrome ou Microsoft Edge.</p>
        </CardContent>
      </Card>
    );
  }

  if (exerciseState === 'finished') {
    const score = (correctAnswers / NUM_SYLLABLES) * 100;
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{NUM_SYLLABLES}</span>.
          </p>
          <ScoreTube score={score} />
          <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
            <RefreshCw className="mr-2" />
            Recommencer
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Progress value={((currentSyllableIndex) / NUM_SYLLABLES) * 100} className="w-full mb-4" />
      <Card className="shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
        </div>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Lis la syllabe à voix haute</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center gap-8 p-6">
            <p className="font-body text-9xl font-bold tracking-wider">{currentSyllable}</p>
             <Button
                onClick={handleMicClick}
                size="lg"
                className={cn("rounded-full h-24 w-24", 
                    isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                )}
                disabled={exerciseState === 'checking'}
             >
                {exerciseState === 'checking' ? <Loader2 className="h-10 w-10 animate-spin" /> : <Mic className="h-10 w-10"/>}
            </Button>
        </CardContent>
        <CardFooter className="h-24 flex items-center justify-center">
          {feedback === 'correct' && (
            <div className="flex items-center gap-4 text-2xl font-bold text-green-600 animate-pulse">
                <Check className='h-8 w-8'/> Parfait !
            </div>
          )}
          {feedback === 'incorrect' && (
            <div className="flex items-center gap-4 text-2xl font-bold text-red-600 animate-shake">
                <X className='h-8 w-8'/> Oups ! La bonne syllabe était "{currentSyllable}".
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
