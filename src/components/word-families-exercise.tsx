
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Check, X, ArrowRight } from 'lucide-react';
import { getSpellingLists, SpellingList } from '@/services/spelling';
import { generateWordFamilies } from '@/ai/flows/generate-word-families-flow';
import Confetti from 'react-dom-confetti';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';

type WordPair = {
  original: string;
  familyMember: string;
};

type ColumnItem = {
  word: string;
  isPaired: boolean;
};

type FeedbackState = 'correct' | 'incorrect' | null;

export function WordFamiliesExercise() {
  const [availableLists, setAvailableLists] = useState<SpellingList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [selectedList, setSelectedList] = useState<SpellingList | null>(null);

  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [isLoadingPairs, setIsLoadingPairs] = useState(false);
  
  const [columnA, setColumnA] = useState<ColumnItem[]>([]);
  const [columnB, setColumnB] = useState<ColumnItem[]>([]);

  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [correctPairs, setCorrectPairs] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: any[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  useEffect(() => {
    async function loadLists() {
      setIsLoadingLists(true);
      const lists = await getSpellingLists();
      setAvailableLists(lists);
      setIsLoadingLists(false);
    }
    loadLists();
  }, []);

  const handleStartExercise = async (listId: string) => {
    const list = availableLists.find(l => l.id === listId);
    if (!list) return;

    setSelectedList(list);
    setIsLoadingPairs(true);
    setPairs([]);
    setColumnA([]);
    setColumnB([]);
    
    try {
      const result = await generateWordFamilies({ words: list.words });
      if (result && result.pairs) {
        const validPairs = result.pairs.filter(p => p.familyMember && p.familyMember.trim() !== '' && p.original.trim() !== p.familyMember.trim());
        setPairs(validPairs);
        setColumnA(shuffleArray(validPairs.map(p => ({ word: p.original, isPaired: false }))));
        setColumnB(shuffleArray(validPairs.map(p => ({ word: p.familyMember, isPaired: false }))));
      }
    } catch (error) {
      console.error("Failed to generate word families:", error);
      // Handle error state in UI
    } finally {
      setIsLoadingPairs(false);
    }
  };

  const checkPair = (wordA: string, wordB: string) => {
    const isCorrect = pairs.some(p => (p.original === wordA && p.familyMember === wordB));
    
    if (isCorrect) {
      setFeedback('correct');
      setCorrectPairs(prev => prev + 1);
      setShowConfetti(true);
      // Mark words as paired
      setColumnA(prev => prev.map(item => item.word === wordA ? { ...item, isPaired: true } : item));
      setColumnB(prev => prev.map(item => item.word === wordB ? { ...item, isPaired: true } : item));
    } else {
      setFeedback('incorrect');
    }

    // Reset selection and feedback after a delay
    setTimeout(() => {
      setSelectedA(null);
      setSelectedB(null);
      setFeedback(null);
      setShowConfetti(false);
    }, 1500);
  };
  
  useEffect(() => {
    if (selectedA && selectedB) {
      checkPair(selectedA, selectedB);
    }
  }, [selectedA, selectedB]);
  
  useEffect(() => {
    if (pairs.length > 0 && correctPairs === pairs.length) {
      setIsFinished(true);
    }
  }, [correctPairs, pairs]);


  const restartExercise = () => {
    setSelectedList(null);
    setPairs([]);
    setColumnA([]);
    setColumnB([]);
    setSelectedA(null);
    setSelectedB(null);
    setCorrectPairs(0);
    setIsFinished(false);
  };

  if (isLoadingLists) {
    return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /> Chargement des listes...</Card>;
  }

  if (!selectedList) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Choisir une liste de mots</CardTitle>
          {availableLists.length === 0 && (
            <CardDescription className="text-destructive text-center">
              Aucune liste de mots n'a été trouvée.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {availableLists.map(list => (
            <Button key={list.id} onClick={() => handleStartExercise(list.id)} variant="outline" size="lg">
              {list.id} – {list.title}
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (isLoadingPairs) {
    return (
        <Card className="w-full shadow-2xl p-8 text-center">
            <Loader2 className="mx-auto animate-spin h-10 w-10 text-primary" />
            <p className="mt-4 text-muted-foreground">L'IA génère les familles de mots...</p>
        </Card>
    );
  }

  if (isFinished) {
    return (
         <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
               <Confetti active={true} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 150, dragFriction: 0.12, duration: 3000, stagger: 3, width: "10px", height: "10px"}} />
            </div>
            <CardHeader>
                <CardTitle className="text-4xl font-headline mb-4">Bravo !</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-2xl">
                    Tu as trouvé toutes les paires !
                </p>
                <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                    <RefreshCw className="mr-2" />
                    Faire un autre exercice
                </Button>
            </CardContent>
        </Card>
    )
  }

  const progress = pairs.length > 0 ? (correctPairs / pairs.length) * 100 : 0;
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl p-4 sm:p-6">
       <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Relie les mots de la même famille</CardTitle>
          <CardDescription className="text-center">Clique sur un mot de chaque colonne pour former une paire.</CardDescription>
          <Progress value={progress} className="w-full mt-4 h-3" />
        </CardHeader>
        <CardContent className="relative">
             {pairs.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    {/* Column A */}
                    <div className="flex flex-col gap-3">
                        {columnA.map(({word, isPaired}) => (
                            <Button 
                                key={word}
                                variant={selectedA === word ? 'default' : 'secondary'}
                                onClick={() => !isPaired && setSelectedA(word)}
                                disabled={isPaired}
                                className={cn("text-base sm:text-lg h-14 transition-all duration-200", 
                                  isPaired && "bg-green-200 text-green-800 line-through pointer-events-none",
                                  feedback === 'incorrect' && selectedA === word && 'bg-red-500/80 animate-shake'
                                )}
                            >
                                {word}
                            </Button>
                        ))}
                    </div>
                    {/* Column B */}
                    <div className="flex flex-col gap-3">
                         {columnB.map(({word, isPaired}) => (
                            <Button 
                                key={word}
                                variant={selectedB === word ? 'default' : 'secondary'}
                                onClick={() => !isPaired && setSelectedB(word)}
                                disabled={isPaired}
                                 className={cn("text-base sm:text-lg h-14 transition-all duration-200", 
                                  isPaired && "bg-green-200 text-green-800 line-through pointer-events-none",
                                  feedback === 'incorrect' && selectedB === word && 'bg-red-500/80 animate-shake'
                                )}
                            >
                                {word}
                            </Button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    <p>L'IA n'a pas pu générer de paires pour cette liste.</p>
                     <Button onClick={restartExercise} variant="outline" className="mt-4">
                        Choisir une autre liste
                    </Button>
                </div>
            )}
            {/* Feedback overlay */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    {feedback === 'correct' ? (
                       <Check className="h-24 w-24 text-green-500 animate-in zoom-in-150" />
                    ) : (
                       <X className="h-24 w-24 text-red-500 animate-in zoom-in-150" />
                    )}
                </div>
            )}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Confetti active={showConfetti} config={{angle: 90, spread: 90, startVelocity: 20, elementCount: 50, duration: 1500, stagger: 2}}/>
            </div>
        </CardContent>
    </Card>
  )

}
