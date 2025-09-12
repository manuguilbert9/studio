
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Check, X, ArrowRight } from 'lucide-react';
import { getSpellingLists, SpellingList } from '@/services/spelling';
import { generateWordFamilies } from '@/ai/flows/generate-word-families-flow';
import Confetti from 'react-dom-confetti';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { ScoreTube } from './score-tube';
import type { SkillLevel } from '@/lib/skills';

type WordPair = {
  original: string;
  familyMember: string;
};

type ColumnItem = {
  word: string;
  isPaired: boolean;
};

type FeedbackState = 'correct' | 'incorrect' | null;

const PAIRS_PER_ROUND = 8;

export function WordFamiliesExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [level, setLevel] = useState<SkillLevel | null>(null);
  
  const [availableLists, setAvailableLists] = useState<SpellingList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [selectedList, setSelectedList] = useState<SpellingList | null>(null);

  const [allPairs, setAllPairs] = useState<WordPair[]>([]);
  const [rounds, setRounds] = useState<WordPair[][]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  const [isLoadingPairs, setIsLoadingPairs] = useState(false);
  
  const [columnA, setColumnA] = useState<ColumnItem[]>([]);
  const [columnB, setColumnB] = useState<ColumnItem[]>([]);

  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [correctPairsInRound, setCorrectPairsInRound] = useState(0);
  const [incorrectPairsCount, setIncorrectPairsCount] = useState(0);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  
  const [showConfetti, setShowConfetti] = useState(false);
  
  const currentRoundPairs = useMemo(() => rounds[currentRoundIndex] || [], [rounds, currentRoundIndex]);
  
  const isRoundFinished = useMemo(() => {
    if (currentRoundPairs.length === 0) return false;
    return correctPairsInRound === currentRoundPairs.length;
  }, [correctPairsInRound, currentRoundPairs]);

  const isExerciseFinished = useMemo(() => {
    return rounds.length > 0 && currentRoundIndex === rounds.length - 1 && isRoundFinished;
  }, [rounds, currentRoundIndex, isRoundFinished]);
  
  useEffect(() => {
    if(student?.levels?.['word-families']) {
        setLevel(student.levels['word-families']);
    } else {
        setLevel('B');
    }
  }, [student]);

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
      const filteredLists = lists.filter(list => {
          const listNum = parseInt(list.id.substring(1));
          if (level === 'B') return listNum <= 12;
          if (level === 'C') return listNum > 12 && listNum <= 24;
          if (level === 'D') return listNum > 24;
          return true;
      });
      setAvailableLists(filteredLists);
      setIsLoadingLists(false);
    }
    if (level) {
        loadLists();
    }
  }, [level]);
  
  const setupRound = (roundIndex: number, pairsForSetup: WordPair[][]) => {
    const pairsForRound = pairsForSetup[roundIndex];
    if (pairsForRound) {
        setColumnA(shuffleArray(pairsForRound.map(p => ({ word: p.original, isPaired: false }))));
        setColumnB(shuffleArray(pairsForRound.map(p => ({ word: p.familyMember, isPaired: false }))));
        setCorrectPairsInRound(0);
        setSelectedA(null);
        setSelectedB(null);
        setFeedback(null);
    }
  }

  const handleStartExercise = async (listId: string) => {
    const list = availableLists.find(l => l.id === listId);
    if (!list) return;

    setSelectedList(list);
    setIsLoadingPairs(true);
    setAllPairs([]);
    setRounds([]);
    setCurrentRoundIndex(0);
    setSessionDetails([]);
    setIncorrectPairsCount(0);
    setHasBeenSaved(false);
    
    try {
      const result = await generateWordFamilies({ words: list.words });
      if (result && result.pairs) {
        const validPairs = result.pairs.filter(p => p.familyMember && p.familyMember.trim() !== '' && p.original.trim() !== p.familyMember.trim());
        setAllPairs(validPairs);
        
        const shuffledPairs = shuffleArray(validPairs);
        const newRounds: WordPair[][] = [];
        for (let i = 0; i < shuffledPairs.length; i += PAIRS_PER_ROUND) {
            newRounds.push(shuffledPairs.slice(i, i + PAIRS_PER_ROUND));
        }
        setRounds(newRounds);
        if (newRounds.length > 0) {
            setupRound(0, newRounds);
        }
      }
    } catch (error) {
      console.error("Failed to generate word families:", error);
    } finally {
      setIsLoadingPairs(false);
    }
  };
  
   const addDetail = (wordA: string, wordB: string, isCorrect: boolean) => {
      const detail: ScoreDetail = {
        question: `Relier ${wordA} et ${wordB}`,
        userAnswer: `${wordA} - ${wordB}`,
        correctAnswer: isCorrect ? 'Correct' : 'Incorrect',
        status: isCorrect ? 'correct' : 'incorrect',
      };
      setSessionDetails(prev => [...prev, detail]);
    };

  const checkPair = (wordA: string, wordB: string) => {
    const isCorrect = currentRoundPairs.some(p => (p.original === wordA && p.familyMember === wordB));
    
    addDetail(wordA, wordB, isCorrect);

    if (isCorrect) {
      setFeedback('correct');
      setCorrectPairsInRound(prev => prev + 1);
      setShowConfetti(true);
      setColumnA(prev => prev.map(item => item.word === wordA ? { ...item, isPaired: true } : item));
      setColumnB(prev => prev.map(item => item.word === wordB ? { ...item, isPaired: true } : item));
    } else {
      setIncorrectPairsCount(prev => prev + 1);
      setFeedback('incorrect');
    }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedA, selectedB]);
  
  useEffect(() => {
      const saveResult = async () => {
          if (isExerciseFinished && student && !hasBeenSaved && level) {
              setHasBeenSaved(true);
              const correctCount = sessionDetails.filter(d => d.status === 'correct').length;
              const incorrectCount = incorrectPairsCount;
              const totalPairs = allPairs.length;
              
              const rawScore = totalPairs > 0 ? ((correctCount - incorrectCount) / totalPairs) * 100 : 0;
              const finalScore = Math.max(0, rawScore);

              if (isHomework && homeworkDate) {
                await saveHomeworkResult({
                    userId: student.id,
                    date: homeworkDate,
                    skillSlug: 'word-families',
                    score: finalScore,
                });
              } else {
                await addScore({
                    userId: student.id,
                    skill: 'word-families',
                    score: finalScore,
                    details: sessionDetails,
                    numberLevelSettings: { level: level }
                });
              }
          }
      };
      saveResult();
   }, [isExerciseFinished, student, hasBeenSaved, sessionDetails, level, allPairs.length, incorrectPairsCount, isHomework, homeworkDate]);

  const goToNextRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      const nextRound = currentRoundIndex + 1;
      setCurrentRoundIndex(nextRound);
      setupRound(nextRound, rounds);
    }
  };

  const restartExercise = () => {
    setSelectedList(null);
    setAllPairs([]);
    setRounds([]);
    setCurrentRoundIndex(0);
    setColumnA([]);
    setColumnB([]);
    setSelectedA(null);
    setSelectedB(null);
    setCorrectPairsInRound(0);
    setIncorrectPairsCount(0);
    setSessionDetails([]);
    setHasBeenSaved(false);
  };

  if (isLoadingLists) {
    return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /> Chargement des listes...</Card>;
  }

  if (!selectedList) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Choisir une liste de mots</CardTitle>
          <CardDescription className="text-center">Le niveau des listes est déterminé par le niveau que vous avez réglé dans le tableau de bord de l'enseignant.</CardDescription>
          {availableLists.length === 0 && (
            <CardDescription className="text-destructive text-center pt-2">
              Aucune liste de mots n'a été trouvée pour le niveau <span className='font-bold'>{level}</span>.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {availableLists.map(list => (
            <Button key={list.id} onClick={() => handleStartExercise(list.id)} variant="outline" size="lg" disabled={availableLists.length === 0}>
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

  if (isExerciseFinished) {
    const finalScore = allPairs.length > 0 ? Math.max(0, ((allPairs.length - incorrectPairsCount) / allPairs.length) * 100) : 0;
    
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
                    Tu as terminé l'exercice !
                </p>
                <ScoreTube score={finalScore} />
                <p className="text-sm text-muted-foreground">{allPairs.length} paires correctes, {incorrectPairsCount} erreurs.</p>
                 {isHomework ? (
                    <p className="text-muted-foreground">Tes devoirs sont terminés !</p>
                 ) : (
                    <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                        <RefreshCw className="mr-2" />
                        Faire un autre exercice
                    </Button>
                 )}
            </CardContent>
        </Card>
    )
  }

  const overallProgress = allPairs.length > 0 ? ((currentRoundIndex * PAIRS_PER_ROUND + correctPairsInRound) / allPairs.length) * 100 : 0;
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl p-4 sm:p-6">
       <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Relie les mots de la même famille</CardTitle>
          <CardDescription className="text-center">
             {rounds.length > 0 && `Manche ${currentRoundIndex + 1} / ${rounds.length}`}
          </CardDescription>
          <Progress value={overallProgress} className="w-full mt-4 h-3" />
        </CardHeader>
        <CardContent className="relative min-h-[400px] flex flex-col justify-center">
             {currentRoundPairs.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    {/* Column A */}
                    <div className="flex flex-col gap-3">
                        {columnA.map(({word, isPaired}) => (
                            <Button 
                                key={word}
                                variant={selectedA === word ? 'default' : 'secondary'}
                                onClick={() => !isPaired && !feedback && setSelectedA(word)}
                                disabled={isPaired || !!feedback}
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
                                onClick={() => !isPaired && !feedback && setSelectedB(word)}
                                disabled={isPaired || !!feedback}
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
            
            {(feedback || isRoundFinished) && !isExerciseFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm flex-col gap-4">
                    {feedback === 'correct' && !isRoundFinished && <Check className="h-24 w-24 text-green-500 animate-in zoom-in-150" />}
                    {feedback === 'incorrect' && <X className="h-24 w-24 text-red-500 animate-in zoom-in-150" />}
                    
                    {isRoundFinished && (
                        <div className="text-center animate-in fade-in">
                            <h3 className="text-2xl font-headline mb-4">Manche terminée !</h3>
                            <Button onClick={goToNextRound} size="lg">
                                Manche suivante <ArrowRight className="ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Confetti active={showConfetti && !isRoundFinished} config={{angle: 90, spread: 90, startVelocity: 20, elementCount: 50, duration: 1500, stagger: 2}}/>
             </div>
        </CardContent>
    </Card>
  )
}
