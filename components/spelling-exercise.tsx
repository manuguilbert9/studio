
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, ArrowLeft, Loader2, Volume2, ThumbsUp, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getSpellingLists, saveSpellingResult, type SpellingList } from '@/services/spelling';
import { cn } from '@/lib/utils';
import Confetti from 'react-dom-confetti';

const WORD_DISPLAY_TIME_MS = 6000;

interface SpellingExerciseProps {
    exerciseId: string;
    onFinish: () => void;
}

export function SpellingExercise({ exerciseId, onFinish }: SpellingExerciseProps) {
  const [list, setList] = useState<SpellingList | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'idle' | 'showing'>('showing');
  const [isFinished, setIsFinished] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('classemagique_username');
    setUsername(storedName);

    async function loadExercise() {
      if (!exerciseId) return;
      
      setIsLoading(true);
      const allLists = await getSpellingLists();
      const listId = exerciseId.split('-')[0];
      const session = exerciseId.split('-')[1]; // 'lundi' or 'jeudi'
      
      const foundList = allLists.find(l => l.id === listId);
      if (!foundList || !session) {
        setIsLoading(false);
        return;
      }
      
      setList(foundList);
      const half = Math.ceil(foundList.words.length / 2);
      const sessionWords = session === 'lundi' ? foundList.words.slice(0, half) : foundList.words.slice(half);
      setWords(sessionWords);
      setIsLoading(false);
    }
    loadExercise();
  }, [exerciseId]);

  const showWord = useCallback(() => {
    setFeedback('showing');
    setInputValue('');
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setFeedback('idle');
      setTimeout(() => inputRef.current?.focus(), 100);
    }, WORD_DISPLAY_TIME_MS);
  }, []);

  useEffect(() => {
    if (words.length > 0 && !isFinished) {
      showWord();
    }
    // Cleanup timeout on component unmount
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    }
  }, [words, currentWordIndex, isFinished, showWord]);

  const handleSubmit = () => {
    if (feedback !== 'idle') return;

    const currentWord = words[currentWordIndex];
    if (inputValue.trim().toLowerCase() === currentWord.toLowerCase()) {
      setFeedback('correct');
      setTimeout(handleNextWord, 1500);
    } else {
      setFeedback('incorrect');
      if (!errors.includes(currentWord)) {
          setErrors(prev => [...prev, currentWord]);
      }
      // No timeout, user has to click "Try Again"
    }
  };

  const handleTryAgain = () => {
    showWord();
  };

  const handleNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      if (username && exerciseId) {
        saveSpellingResult(username, exerciseId, errors);
      }
      setIsFinished(true);
    }
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(words[currentWordIndex]);
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!list || words.length === 0) {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
            <Card className="p-8 text-center">
                <h2 className="text-xl font-semibold text-destructive">Erreur</h2>
                <p className="text-muted-foreground mt-2">Impossible de charger l'exercice.</p>
                <Button onClick={onFinish} className="mt-4">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Retour à la liste
                </Button>
            </Card>
        </main>
    )
  }
  
  const currentWord = words[currentWordIndex];
  const progress = ((currentWordIndex + (feedback === 'correct' ? 1 : 0)) / words.length) * 100;

  if (isFinished) {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
             <Card className="w-full max-w-lg text-center p-6 sm:p-12 shadow-2xl relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Confetti active={true} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 3000, stagger: 3, width: "10px", height: "10px"}} />
                </div>
                <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h1 className="font-headline text-4xl mb-4">Bravo !</h1>
                <p className="text-lg text-muted-foreground mb-2">Tu as terminé la liste de devoirs.</p>
                 {errors.length > 0 ? (
                    <div className="mt-6 text-left">
                        <p className="font-semibold text-lg mb-2">Mots à revoir :</p>
                        <Card className="p-4 bg-muted/50">
                            <ul className="flex flex-wrap gap-x-4 gap-y-1">
                                {errors.map(error => <li key={error} className="font-semibold text-destructive">{error}</li>)}
                            </ul>
                        </Card>
                    </div>
                ) : (
                    <p className="mt-6 text-green-600 font-semibold text-lg flex items-center justify-center gap-2">
                        <ThumbsUp />
                        Aucune erreur, félicitations !
                    </p>
                )}

                 <Button onClick={onFinish} size="lg" className="mt-8 w-full">
                    Retourner à la liste
                </Button>
            </Card>
        </main>
    )
  }

  return (
    <>
      <header className="relative flex items-center justify-center mb-4 w-full max-w-2xl">
         <Button variant="ghost" className="absolute left-0" onClick={onFinish}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
        </Button>
        <h1 className="font-headline text-2xl sm:text-3xl text-center">{list.id} - {list.title}</h1>
      </header>

      <div className="w-full max-w-2xl">
        <Progress value={progress} className="w-full mb-8 h-3" />

        <Card className="w-full min-h-[350px] sm:min-h-[400px] p-6 sm:p-8 flex flex-col justify-between items-center shadow-2xl">
          {feedback === 'showing' ? (
            <div className="flex flex-col items-center justify-center w-full h-full animate-in fade-in">
              <p className="font-bold text-5xl sm:text-7xl font-body tracking-wider">{currentWord}</p>
              <button onClick={handleSpeak} className="mt-8 text-muted-foreground hover:text-primary transition-colors">
                <Volume2 className="h-8 w-8" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full animate-in fade-in">
              <div className="relative w-full max-w-md">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Écris le mot ici..."
                  className={cn("h-16 text-2xl text-center",
                    feedback === 'correct' && 'border-green-500 ring-green-500',
                    feedback === 'incorrect' && 'border-red-500 ring-red-500 animate-shake'
                  )}
                  disabled={feedback === 'correct'}
                />
                 {feedback === 'correct' && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-green-500"/>}
                 {feedback === 'incorrect' && <X className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-red-500"/>}
              </div>
              
              {feedback === 'idle' && (
                <Button onClick={handleSubmit} size="lg" className="mt-8 w-full max-w-md text-lg">Valider</Button>
              )}
              {feedback === 'incorrect' && (
                <div className="mt-6 text-center w-full max-w-md">
                    <p className="text-destructive font-semibold mb-4">Ce n'est pas tout à fait ça. Le mot était :</p>
                    <p className="font-bold text-4xl text-primary mb-6">{currentWord}</p>
                    <Button onClick={handleTryAgain} size="lg" variant="outline" className="w-full text-lg">Réessayer</Button>
                </div>
              )}
               {feedback === 'correct' && (
                <div className="mt-6 text-center text-green-600 font-semibold text-2xl animate-pulse">
                    Parfait !
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
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
    </>
  );
}
