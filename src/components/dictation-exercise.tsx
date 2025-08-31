
'use client';

import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, RefreshCw, Volume2, Send, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getSpellingLists, SpellingList } from '@/services/spelling';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { addScore } from '@/services/scores';
import { UserContext } from '@/context/user-context';
import { ScoreTube } from './score-tube';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface DictationExerciseProps {
  isTableauMode?: boolean;
}

type DictationResult = {
  word: string;
  userAnswer: string;
  isCorrect: boolean;
};

const REPEAT_INTERVAL_MS = 5000;

export function DictationExercise({ isTableauMode = false }: DictationExerciseProps) {
  const { student } = useContext(UserContext);
  
  const [availableLists, setAvailableLists] = useState<SpellingList[]>([]);
  const [selectedList, setSelectedList] = useState<SpellingList | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<DictationResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadLists() {
      setIsLoadingLists(true);
      const lists = await getSpellingLists();
      setAvailableLists(lists);
      setIsLoadingLists(false);
    }
    loadLists();
  }, []);

  const handleSpeak = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8; // A bit slower
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }
    };
  }, []);

  const startExercise = (listId: string) => {
    const list = availableLists.find(l => l.id === listId);
    if (!list) return;

    setSelectedList(list);
    const cleanedWords = list.words.map(word => 
        word.replace(/\|.*/, '').replace(/[\(\)-]/g, '').trim()
    );
    setWords(cleanedWords);
    setCurrentWordIndex(0);
    setResults([]);
    setIsFinished(false);
    handleSpeak(cleanedWords[0]);
    if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
    repeatIntervalRef.current = setInterval(() => handleSpeak(cleanedWords[currentWordIndex]), REPEAT_INTERVAL_MS);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  
  useEffect(() => {
    if (words.length > 0 && !isFinished) {
        if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
        const currentWord = words[currentWordIndex];
        handleSpeak(currentWord); // Speak immediately
        repeatIntervalRef.current = setInterval(() => handleSpeak(currentWord), REPEAT_INTERVAL_MS);
         setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentWordIndex, words, isFinished, handleSpeak]);


  const handleSubmit = async () => {
    if (inputValue.trim() === '') return;
    
    const currentWord = words[currentWordIndex];
    const isCorrect = inputValue.trim().toLowerCase() === currentWord.toLowerCase();
    
    const newResult: DictationResult = {
      word: currentWord,
      userAnswer: inputValue.trim(),
      isCorrect,
    };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setInputValue('');

    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // End of exercise
      if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
      setIsFinished(true);
      if (student && !isTableauMode) {
        setIsSaving(true);
        const correctCount = updatedResults.filter(r => r.isCorrect).length;
        const score = (correctCount / words.length) * 100;
        await addScore({
          userId: student.id,
          skill: 'dictation',
          score: score,
        });
        setIsSaving(false);
      }
    }
  };

  const restartExercise = () => {
    setSelectedList(null);
    setWords([]);
    setCurrentWordIndex(0);
    setResults([]);
    setIsFinished(false);
  };
  
  if (isLoadingLists) {
    return <Card className="w-full shadow-2xl p-8 text-center">Chargement des listes de dictée...</Card>;
  }

  if (!selectedList) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Choisir une liste de dictée</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
            {availableLists.map(list => (
                <Button key={list.id} onClick={() => startExercise(list.id)} variant="outline" size="lg">
                    {list.id} – {list.title}
                </Button>
            ))}
        </CardContent>
      </Card>
    )
  }

  if (isFinished) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = words.length;
    const score = (correctCount / totalCount) * 100;
    const errors = results.filter(r => !r.isCorrect);

    return (
      <Card className="w-full shadow-2xl text-center p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-headline mb-4">Dictée terminée !</CardTitle>
           <CardDescription>
             Tu as obtenu <span className="font-bold text-primary">{correctCount}</span> sur <span className="font-bold">{totalCount}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreTube score={score} />
          
          {errors.length > 0 && (
            <div className="text-left">
                <h3 className="font-headline text-xl mb-2 text-center">Tes erreurs à corriger :</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ta réponse</TableHead>
                            <TableHead>La bonne réponse</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {errors.map((error, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-semibold text-destructive">{error.userAnswer}</TableCell>
                                <TableCell className="font-semibold text-green-600">{error.word}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          )}

          <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
            <RefreshCw className="mr-2" />
            Faire une autre dictée
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(!isTableauMode && "w-full")}>
      <Progress value={((currentWordIndex + 1) / words.length) * 100} className="w-full mb-4" />
      <Card className={cn(
        "w-full relative overflow-hidden",
        isTableauMode ? "shadow-none border-0 bg-transparent" : "shadow-2xl"
      )}>
        <CardHeader>
          <CardTitle className="text-center font-body text-2xl">
            Écoute bien et écris le mot
          </CardTitle>
          <CardDescription className="text-center">
            Mot {currentWordIndex + 1} sur {words.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-8 min-h-[200px] p-4 sm:p-6">
          <Button onClick={() => handleSpeak(words[currentWordIndex])} variant="outline" size="lg">
            <Volume2 className="mr-4 h-8 w-8" />
            Répéter le mot
          </Button>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit();}} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Écris le mot ici..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-14 text-2xl"
            />
            <Button type="submit" size="icon" className="h-14 w-14">
              <Send />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
