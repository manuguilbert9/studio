
'use client';

import { useState, useEffect, useMemo, useCallback, useContext, useRef, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Loader2, Play, Pause, Flag, Repeat, ArrowLeft, X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

type ExerciseState = 'selecting' | 'ready' | 'racing' | 'finished';

interface FluenceText {
    level: string;
    title: string;
    content: string;
    wordCount: number;
    subCategory?: string;
}

export function ReadingRaceExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [textsByLevel, setTextsByLevel] = useState<Record<string, FluenceText[]>>({});
  const [isLoadingTexts, setIsLoadingTexts] = useState(true);

  const [selectedText, setSelectedText] = useState<FluenceText | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('selecting');
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [finalMCLM, setFinalMCLM] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchTexts() {
        setIsLoadingTexts(true);
        try {
            const levels = ['B', 'C', 'D'];
            const allTexts: Record<string, FluenceText[]> = {};

            for (const level of levels) {
                const response = await fetch(`/api/fluence-texts?level=${level}`);
                if (!response.ok) throw new Error(`Failed to fetch texts for level ${level}`);
                const texts: FluenceText[] = await response.json();
                allTexts[`Niveau ${level}`] = texts;
            }
            setTextsByLevel(allTexts);
        } catch (error) {
            console.error("Error fetching fluence texts:", error);
        } finally {
            setIsLoadingTexts(false);
        }
    }
    fetchTexts();
  }, []);

  const textsGroupedBySubCategory = useMemo(() => {
    const grouped: Record<string, Record<string, FluenceText[]>> = {};
    Object.keys(textsByLevel).forEach(level => {
      grouped[level] = {};
      const texts = textsByLevel[level];
      texts.forEach(text => {
        const subCategory = text.subCategory || 'default';
        if (!grouped[level][subCategory]) {
          grouped[level][subCategory] = [];
        }
        grouped[level][subCategory].push(text);
      });
    });
    return grouped;
  }, [textsByLevel]);


  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);
  
  const stopRaceAndCalculate = useCallback(() => {
    setIsTimerRunning(false);
    
    if (!selectedText || timeElapsed === 0) {
        setFinalMCLM(0);
        setExerciseState('finished');
        return;
    }

    const wordsRead = selectedText.wordCount - errorCount;
    const mclm = Math.round((wordsRead / timeElapsed) * 60);
    setFinalMCLM(Math.max(0, mclm));
    setExerciseState('finished');
  }, [selectedText, timeElapsed, errorCount]);

   useEffect(() => {
      async function saveResult() {
          if (exerciseState === 'finished' && student && !hasBeenSaved && selectedText) {
              setHasBeenSaved(true);
              const detail: ScoreDetail = {
                    question: `Fluence: "${selectedText.title}"`,
                    userAnswer: `Temps: ${timeElapsed}s, Erreurs: ${errorCount}`,
                    correctAnswer: `${selectedText.wordCount} mots`,
                    status: 'completed',
              };

              if (isHomework && homeworkDate) {
                await saveHomeworkResult({
                    userId: student.id,
                    date: homeworkDate,
                    skillSlug: 'fluence',
                    score: finalMCLM
                });
              } else {
                await addScore({
                    userId: student.id,
                    skill: 'fluence',
                    score: finalMCLM,
                    details: [detail],
                    readingRaceSettings: { level: selectedText.level as any }
                });
              }
          }
      };
      if (exerciseState === 'finished') {
        saveResult();
      }
   }, [exerciseState, student, finalMCLM, hasBeenSaved, selectedText, timeElapsed, errorCount, isHomework, homeworkDate]);
  
  
  const handleSelectText = (text: FluenceText) => {
    setSelectedText(text);
    setExerciseState('ready');
  };

  const startTimer = () => {
    setTimeElapsed(0);
    setErrorCount(0);
    setFinalMCLM(0);
    setHasBeenSaved(false);
    setIsTimerRunning(true);
    setExerciseState('racing');
  };
  
  const resetExercise = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedText(null);
    setExerciseState('selecting');
    setTimeElapsed(0);
    setErrorCount(0);
    setHasBeenSaved(false);
    setIsTimerRunning(false);
  };

  const tryAgain = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeElapsed(0);
    setErrorCount(0);
    setFinalMCLM(0);
    setHasBeenSaved(false);
    setIsTimerRunning(false);
    setExerciseState('ready');
  }

  // --- Render Logic ---

  if (isLoadingTexts) {
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Chargement des textes de fluence...</p>
        </Card>
    );
  }

  if (exerciseState === 'selecting' || !selectedText) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Choisis un texte</CardTitle>
          <CardDescription className="text-center">Choisis un texte pour commencer l'exercice de fluence.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
                {Object.entries(textsGroupedBySubCategory).map(([level, subCategories]) => (
                     <AccordionItem value={level} key={level}>
                        <AccordionTrigger className="text-xl font-semibold">{level}</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 pl-2">
                           {Object.entries(subCategories).map(([subCategory, texts]) => (
                                <div key={subCategory}>
                                  {subCategory !== 'default' && <h4 className="font-semibold text-muted-foreground mb-2 capitalize">{subCategory.replace(/_/g, ' ')}</h4>}
                                  <div className="flex flex-col gap-2">
                                      {texts.map((item, index) => (
                                          <Button key={index} onClick={() => handleSelectText(item)} variant="outline" size="lg" className="h-auto py-3 justify-start">
                                              <span className='font-normal text-lg'>{item.title}</span>
                                              <span className='ml-auto text-xs text-muted-foreground'>{item.wordCount} mots</span>
                                          </Button>
                                      ))}
                                  </div>
                                </div>
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
                <CardDescription className="text-center">Prépare-toi à lire le texte. Démarre le chronomètre quand tu commences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg p-4 bg-muted/50 rounded-lg leading-relaxed">{selectedText.content}</p>
                <div className='text-center'>
                    <Button onClick={startTimer} size="lg">
                        <Play className="mr-2" />
                        Démarrer le chronomètre
                    </Button>
                </div>
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
      return (
         <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">{selectedText.title}</CardTitle>
                 <CardDescription className="text-center pt-4 font-mono text-4xl font-bold">
                    {Math.floor(timeElapsed / 60).toString().padStart(2,'0')}:{ (timeElapsed % 60).toString().padStart(2, '0') }
                 </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <p className="text-xl p-4 bg-muted/50 rounded-lg leading-relaxed">{selectedText.content}</p>
                <div className="flex items-center justify-center gap-4">
                     <Button onClick={() => setIsTimerRunning(p => !p)} size="lg" variant="secondary">
                        {isTimerRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                        {isTimerRunning ? 'Pause' : 'Reprendre'}
                    </Button>
                    <Button onClick={stopRaceAndCalculate} size="lg" variant="destructive">
                        <Flag className="mr-2" />
                        J'ai terminé !
                    </Button>
                </div>
            </CardContent>
         </Card>
      )
  }

  if (exerciseState === 'finished') {
      return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl text-center">
            <CardHeader>
                <CardTitle className="font-headline text-4xl mb-2">Lecture terminée !</CardTitle>
                <Flag className="h-10 w-10 mx-auto text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                        <CardDescription>Temps de lecture</CardDescription>
                        <p className="text-3xl font-bold">{timeElapsed}s</p>
                    </Card>
                    <Card className="p-4">
                        <CardDescription>Nombre de mots</CardDescription>
                        <p className="text-3xl font-bold">{selectedText.wordCount}</p>
                    </Card>
                </div>
                <Card className="p-4">
                    <Label htmlFor="errors" className="text-lg">Nombre d'erreurs</Label>
                    <Input 
                        id="errors"
                        type="number" 
                        value={errorCount}
                        onChange={(e) => setErrorCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-24 h-12 text-2xl text-center mx-auto mt-2"
                    />
                </Card>
                 <Card className="p-6 bg-primary/10 border-primary">
                    <CardDescription>Score de fluence</CardDescription>
                    <p className="text-5xl font-bold">{finalMCLM} <span className="text-2xl font-medium">MCLM</span></p>
                    <p className="text-xs text-muted-foreground">(Mots Correctement Lus par Minute)</p>
                </Card>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
                 <Button onClick={resetExercise} size="lg">
                    <X className="mr-2" />
                    Terminer et choisir un autre texte
                </Button>
                <Button onClick={tryAgain} variant="ghost" size="sm">
                    <Repeat className="mr-2" />
                    Recommencer la même lecture
                </Button>
            </CardFooter>
        </Card>
      )
  }

  return null;
}
