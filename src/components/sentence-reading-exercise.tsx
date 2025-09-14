'use client';

import { useState, useEffect, useMemo, useCallback, useContext, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Mic, Repeat, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import type { ExpansionTextInfo, ExpansionTextContent } from '@/app/api/expansion-texts/route';
import { Progress } from './ui/progress';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import Confetti from 'react-dom-confetti';

type ExerciseState = 'selecting' | 'reading' | 'finished';

const normalize = (str: string) => {
    return str
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[.,'!?]/g, ''); // remove punctuation
};

export function SentenceReadingExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [texts, setTexts] = useState<ExpansionTextInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedText, setSelectedText] = useState<ExpansionTextContent | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('selecting');
  
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
      onResult: (result) => {
        checkAnswer(result);
      },
      onError: (err) => {
        if (err === 'aborted') return;
        setFeedback('incorrect');
      }
  });

  const currentSentence = useMemo(() => selectedText?.sentences[currentSentenceIndex] || '', [selectedText, currentSentenceIndex]);

  useEffect(() => {
    async function fetchTexts() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/expansion-texts');
            if (!response.ok) throw new Error('Failed to fetch texts');
            const data: ExpansionTextInfo[] = await response.json();
            setTexts(data);
        } catch (error) {
            console.error("Error fetching expansion texts:", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchTexts();
  }, []);

  const handleSelectText = async (fileId: string) => {
    setIsLoading(true);
    try {
        const response = await fetch(`/api/expansion-texts?id=${fileId}`);
        if (!response.ok) throw new Error('Failed to fetch text content');
        const data: ExpansionTextContent = await response.json();
        setSelectedText(data);
        setExerciseState('reading');
    } catch (error) {
         console.error("Error fetching text content:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleNextSentence = useCallback(() => {
    setShowConfetti(false);
    if (selectedText && currentSentenceIndex < selectedText.sentences.length - 1) {
        setCurrentSentenceIndex(prev => prev + 1);
        setFeedback(null);
    } else {
        setExerciseState('finished');
    }
  }, [selectedText, currentSentenceIndex]);

  const checkAnswer = (spokenText: string) => {
    if (!currentSentence || isListening) return;
    
    stopListening();
    
    const isCorrect = normalize(spokenText) === normalize(currentSentence);
    
    const detail: ScoreDetail = {
        question: `Lire : "${currentSentence}"`,
        userAnswer: spokenText,
        correctAnswer: currentSentence,
        status: isCorrect ? 'correct' : 'incorrect',
    };
    setSessionDetails(prev => [...prev, detail]);

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(handleNextSentence, 2000);
    }
    // If incorrect, user has to click "Réessayer"
  };

  const handleRetry = () => {
    setFeedback(null);
    startListening();
  };

  useEffect(() => {
      async function saveResult() {
          if (exerciseState === 'finished' && student && !hasBeenSaved && selectedText) {
              setHasBeenSaved(true);
              const correctCount = sessionDetails.filter(d => d.status === 'correct').length;
              const score = (correctCount / selectedText.sentences.length) * 100;
              
              if (isHomework && homeworkDate) {
                await saveHomeworkResult({
                    userId: student.id,
                    date: homeworkDate,
                    skillSlug: 'lire-des-phrases',
                    score: score
                });
              } else {
                await addScore({
                    userId: student.id,
                    skill: 'lire-des-phrases',
                    score: score,
                    details: sessionDetails,
                    numberLevelSettings: { level: 'B' }
                });
              }
          }
      };
      if (exerciseState === 'finished') {
        saveResult();
      }
   }, [exerciseState, student, hasBeenSaved, selectedText, sessionDetails, isHomework, homeworkDate]);

  const resetExercise = () => {
    setSelectedText(null);
    setExerciseState('selecting');
    setCurrentSentenceIndex(0);
    setFeedback(null);
    setSessionDetails([]);
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

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </Card>
    );
  }

  if (exerciseState === 'selecting' || !selectedText) {
    return (
      <Card className="w-full max-w-xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Choisis une série de phrases</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
           {texts.map(text => (
            <Button key={text.id} onClick={() => handleSelectText(text.id)} variant="outline" className="h-auto py-3">
                <div className="flex flex-col items-start w-full">
                    <p className="font-semibold text-lg">{text.title}</p>
                    <p className="text-sm text-muted-foreground">{text.sentenceCount} phrases</p>
                </div>
            </Button>
           ))}
        </CardContent>
      </Card>
    );
  }
  
  if (exerciseState === 'finished') {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Confetti active={true} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 150, dragFriction: 0.12, duration: 3000, stagger: 3, width: "10px", height: "10px"}} />
        </div>
        <CardHeader>
            <CardTitle className="text-4xl font-headline mb-4">Bravo !</CardTitle>
            <CardDescription>Tu as terminé la série de phrases.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button onClick={resetExercise} size="lg">
                <ArrowLeft className="mr-2" />
                Choisir une autre série
            </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-2xl">
        <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">{selectedText.title}</CardTitle>
            <Progress value={(currentSentenceIndex / selectedText.sentences.length) * 100} className="w-full mt-4 h-3" />
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center gap-8 p-6">
            <p className={cn(
                "font-body text-4xl font-semibold leading-normal transition-colors duration-300",
                feedback === 'correct' && 'text-green-600',
                feedback === 'incorrect' && 'text-red-500'
            )}>
                {currentSentence}
            </p>
            <Button
                onClick={isListening ? stopListening : startListening}
                disabled={!!feedback}
                size="lg"
                className={cn("rounded-full h-24 w-24", isListening && 'bg-red-500 hover:bg-red-600 animate-pulse')}
             >
                <Mic className="h-10 w-10"/>
            </Button>
        </CardContent>
        <CardFooter className="h-24 flex items-center justify-center">
          {feedback === 'correct' && (
            <div className="flex items-center gap-4 text-2xl font-bold text-green-600 animate-pulse">
                <CheckCircle className='h-8 w-8'/> Parfait !
            </div>
          )}
          {feedback === 'incorrect' && (
            <div className="flex items-center gap-4 text-xl font-bold text-red-600">
                <XCircle className='h-8 w-8'/> Oups, ce n'est pas tout à fait ça.
                <Button onClick={handleRetry} variant="secondary" size="sm">
                    <Repeat className="mr-2 h-4 w-4"/> Réessayer
                </Button>
            </div>
          )}
        </CardFooter>
    </Card>
  )
}
