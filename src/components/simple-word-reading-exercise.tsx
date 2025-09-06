
'use client';

import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Mic, Check, X, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { getSimpleWords } from '@/lib/word-list';
import Confetti from 'react-dom-confetti';
import { ScoreTube } from './score-tube';


const WORDS_PER_EXERCISE = 10;
type ExerciseState = 'ready' | 'listening' | 'checking' | 'finished';

export function SimpleWordReadingExercise() {
  const { student } = useContext(UserContext);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('ready');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [detectedWord, setDetectedWord] = useState('');
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);


  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
      onResult: (result) => {
        checkAnswer(result);
      },
      onError: (err) => {
        // Ignore "aborted" which happens on manual stop
        if (err === 'aborted') return;
        console.error(err);
        setExerciseState('ready');
      }
  });
  
  useEffect(() => {
    setWords(getSimpleWords(WORDS_PER_EXERCISE));
  }, []);
  
  // Effect to auto-start listening when a new word is ready
  useEffect(() => {
    if(exerciseState === 'ready' && currentWordIndex < WORDS_PER_EXERCISE) {
      handleMicClick();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseState, currentWordIndex]);

  const currentWord = useMemo(() => words[currentWordIndex], [words, currentWordIndex]);

  const handleNextWord = useCallback(() => {
    setShowConfetti(false);
    if (currentWordIndex < WORDS_PER_EXERCISE - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setFeedback(null);
      setDetectedWord('');
      setExerciseState('ready'); // This will trigger the useEffect to start listening again
    } else {
      setExerciseState('finished');
    }
  }, [currentWordIndex]);
  
  const checkAnswer = (spokenText: string) => {
    if (exerciseState !== 'listening' || !currentWord) return;

    setExerciseState('checking');
    stopListening();
    
    setDetectedWord(spokenText); // Store what was heard

    // Normalize both strings for comparison to handle homophones and silent letters
    const normalize = (str: string) => {
        return str
            .toLowerCase()
            .trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[.,'-]/g, '') // remove punctuation
            .replace(/y/g, 'i') // Treat 'y' and 'i' as the same
            .replace(/[stdpxz]$/, ''); // remove common silent final letters
    }

    const expected = normalize(currentWord);
    const actual = normalize(spokenText);
    const isCorrect = expected === actual;
    
    const detail: ScoreDetail = {
        question: `Lire le mot "${currentWord}"`,
        userAnswer: spokenText,
        correctAnswer: currentWord,
        status: isCorrect ? 'correct' : 'incorrect',
    };
    setSessionDetails(prev => [...prev, detail]);

    if (isCorrect) {
      setFeedback('correct');
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);
    } else {
      setFeedback('incorrect');
    }
    setTimeout(handleNextWord, 2500);
  };
  
  const handleMicClick = () => {
    if (exerciseState === 'ready') {
      startListening();
      setExerciseState('listening');
    } else if (exerciseState === 'listening') {
      stopListening();
      setExerciseState('ready');
    }
  };

  useEffect(() => {
      const saveResult = async () => {
          if (exerciseState === 'finished' && student && !hasBeenSaved) {
              setHasBeenSaved(true);
              const score = (correctAnswers / WORDS_PER_EXERCISE) * 100;
              await addScore({
                  userId: student.id,
                  skill: 'simple-word-reading',
                  score: score,
                  details: sessionDetails
              });
          }
      };
      saveResult();
   }, [exerciseState, student, correctAnswers, hasBeenSaved, sessionDetails]);

  const restartExercise = () => {
    setWords(getSimpleWords(WORDS_PER_EXERCISE));
    setCurrentWordIndex(0);
    setExerciseState('ready');
    setFeedback(null);
    setCorrectAnswers(0);
    setShowConfetti(false);
    setHasBeenSaved(false);
    setDetectedWord('');
    setSessionDetails([]);
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
    const score = (correctAnswers / WORDS_PER_EXERCISE) * 100;
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{WORDS_PER_EXERCISE}</span>.
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
      <Progress value={((currentWordIndex) / WORDS_PER_EXERCISE) * 100} className="w-full mb-4" />
      <Card className="shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
        </div>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Lis le mot à voix haute</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center gap-8 p-6">
            <p className="font-body text-8xl sm:text-9xl font-bold tracking-wider uppercase">{currentWord}</p>
             <Button
                onClick={handleMicClick}
                size="lg"
                className={cn("rounded-full h-24 w-24", 
                    isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'
                )}
                disabled={exerciseState === 'checking' || isListening}
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
            <div className="flex flex-col items-center gap-2 text-xl font-bold text-red-600 animate-shake">
                <div className="flex items-center gap-2">
                    <X className='h-6 w-6'/> Oups ! Le mot était "{currentWord}".
                </div>
                {detectedWord && <p className="text-sm text-muted-foreground">(J'ai entendu : "{detectedWord}")</p>}
            </div>
          )}
        </CardFooter>
      </Card>
       <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
    </div>
  )
}
