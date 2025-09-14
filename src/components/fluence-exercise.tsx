
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, RefreshCw, ArrowLeft, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UserContext } from '@/context/user-context';
import { addScore } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FluenceText {
  level: string;
  title: string;
  content: string;
  wordCount: number;
  subCategory?: string;
}

type ExerciseState = 'selecting' | 'reading' | 'finished';

const calculateMCLM = (wordCount: number, seconds: number, errors: number): number => {
  if (seconds === 0) return 0;
  const wordsRead = wordCount - errors;
  const minutes = seconds / 60;
  return Math.round(wordsRead / minutes);
};

export function FluenceExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');
  const { toast } = useToast();

  const [allTexts, setAllTexts] = useState<Record<string, FluenceText[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<FluenceText | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('selecting');
  
  // Timer state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Score state
  const [errors, setErrors] = useState(0);
  const [mclm, setMclm] = useState(0);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  useEffect(() => {
    async function fetchTexts() {
      setIsLoading(true);
      try {
        const levels = ['B', 'C', 'D'];
        const textsByLevel: Record<string, FluenceText[]> = {};
        for (const level of levels) {
          const response = await fetch(`/api/fluence-texts?level=${level}`);
          if (!response.ok) throw new Error(`Failed to fetch texts for level ${level}`);
          const texts: FluenceText[] = await response.json();
          textsByLevel[`Niveau ${level}`] = texts;
        }
        setAllTexts(textsByLevel);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les textes de fluence.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTexts();
  }, [toast]);
  
   useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);
  
  const handleSelectText = (text: FluenceText) => {
    setSelectedText(text);
    setExerciseState('reading');
    setTime(0);
    setErrors(0);
    setMclm(0);
    setHasBeenSaved(false);
  };
  
  const handleStop = () => {
    setIsRunning(false);
    if (selectedText) {
        const score = calculateMCLM(selectedText.wordCount, time, errors);
        setMclm(score);
    }
  };

  const handleRecalculate = () => {
    if(selectedText) {
        const score = calculateMCLM(selectedText.wordCount, time, errors);
        setMclm(score);
    }
  }

  useEffect(() => {
    async function saveResult() {
      if (mclm > 0 && student && !hasBeenSaved && selectedText) {
        setHasBeenSaved(true);
        const details = [{
            question: selectedText.title,
            userAnswer: `${mclm} MCLM`,
            correctAnswer: `Temps: ${time}s, Erreurs: ${errors}`,
            status: 'completed' as const,
            mistakes: [],
        }];

        if (isHomework && homeworkDate) {
           await saveHomeworkResult({
              userId: student.id,
              date: homeworkDate,
              skillSlug: 'fluence',
              score: mclm,
           });
        } else {
          await addScore({
            userId: student.id,
            skill: 'fluence',
            score: mclm,
            details: details,
            readingRaceSettings: { level: selectedText.level as any }
          });
        }
        toast({ title: 'Score enregistré !', description: `Ton score de ${mclm} MCLM a été sauvegardé.` });
      }
    }
    saveResult();
  }, [mclm, student, hasBeenSaved, selectedText, time, errors, toast, isHomework, homeworkDate]);

  const resetExercise = () => {
    setExerciseState('selecting');
    setSelectedText(null);
    setIsRunning(false);
  };

  const textsForLevelB = useMemo(() => {
    const texts = allTexts['Niveau B'] || [];
    return {
      'Sons simples': texts.filter(t => t.subCategory === 'sons simples'),
      'Sons complexes': texts.filter(t => t.subCategory === 'sons complexes'),
    };
  }, [allTexts]);
  
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </Card>
    );
  }
  
  if (exerciseState === 'selecting') {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Choisis un texte à lire</CardTitle>
          <CardDescription className="text-center">Le but est de lire le texte à voix haute le plus vite et le mieux possible.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(allTexts).map(([level, texts]) => {
              if (texts.length === 0) return null;

              if (level === 'Niveau B') {
                return (
                  <AccordionItem value={level} key={level}>
                    <AccordionTrigger className="text-xl font-semibold">{level}</AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="single" collapsible className="w-full pl-4">
                        {Object.entries(textsForLevelB).map(([subCategory, subTexts]) => {
                          if (subTexts.length === 0) return null;
                          return (
                            <AccordionItem value={subCategory} key={subCategory}>
                              <AccordionTrigger>{subCategory}</AccordionTrigger>
                              <AccordionContent className="flex flex-col gap-2 pl-4">
                                {subTexts.map(text => (
                                  <Button key={text.title} onClick={() => handleSelectText(text)} variant="ghost" className="justify-between h-auto py-2">
                                    <span>{text.title}</span>
                                    <span className="text-xs text-muted-foreground">{text.wordCount} mots</span>
                                  </Button>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                )
              }

              return (
                 <AccordionItem value={level} key={level}>
                  <AccordionTrigger className="text-xl font-semibold">{level}</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2">
                    {texts.map(text => (
                      <Button key={text.title} onClick={() => handleSelectText(text)} variant="ghost" className="justify-between h-auto py-2">
                        <span>{text.title}</span>
                        <span className="text-xs text-muted-foreground">{text.wordCount} mots</span>
                      </Button>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>
    );
  }
  
  if(selectedText) {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <Button onClick={resetExercise} variant="outline"><ArrowLeft className="mr-2"/> Choisir un autre texte</Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{selectedText.title}</CardTitle>
                    <CardDescription>{selectedText.level}{selectedText.subCategory && ` - ${selectedText.subCategory}`} - {selectedText.wordCount} mots</CardDescription>
                </CardHeader>
                <CardContent className="prose max-w-none text-xl leading-relaxed">
                    {selectedText.content}
                </CardContent>
            </Card>

            <Card className="sticky bottom-4 shadow-2xl">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-around gap-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Chronomètre</p>
                        <p className="font-mono text-5xl font-bold">{formatTime(time)}</p>
                    </div>

                    <div className="flex items-center gap-4">
                         <Button
                            onClick={() => setIsRunning(!isRunning)}
                            size="lg"
                            variant={isRunning ? 'destructive' : 'default'}
                            className="w-40"
                         >
                            {isRunning ? <><Pause className="mr-2"/> Stop</> : <><Play className="mr-2"/> Démarrer</>}
                        </Button>
                         <Button
                            onClick={handleStop}
                            size="lg"
                            variant="secondary"
                            disabled={isRunning}
                            className="w-40"
                         >
                            <Calculator className="mr-2"/> Calculer
                        </Button>
                    </div>
                    
                     <div className="flex items-center gap-2">
                        <div className="text-center">
                             <Label htmlFor="errors" className="text-sm text-muted-foreground">Erreurs</Label>
                            <Input 
                                id="errors"
                                type="number" 
                                value={errors}
                                onChange={e => setErrors(parseInt(e.target.value, 10) || 0)}
                                className="w-24 h-14 text-2xl text-center font-bold"
                                onBlur={handleRecalculate}
                            />
                        </div>
                         <div className="text-center pt-5">
                            <p className="text-sm text-muted-foreground">Score</p>
                            <p className="text-4xl font-bold">{mclm} <span className="text-base font-normal text-muted-foreground">MCLM</span></p>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
  }

  return null;
}
