
'use client';

import { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import type { SkillLevel } from '@/lib/skills';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { Check, RefreshCw, X, Loader2, Volume2 } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { Progress } from '@/components/ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { ScoreTube } from './score-tube';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getSpellingLists, type SpellingList } from '@/services/spelling';
import { generateSpeech } from '@/ai/flows/tts-flow';

const normalizeText = (text: string) => {
  return text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function DictationExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [level, setLevel] = useState<SkillLevel>('B');
  const [availableLists, setAvailableLists] = useState<SpellingList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [selectedList, setSelectedList] = useState<SpellingList | null>(null);

  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (student?.levels?.['dictee']) {
      setLevel(student.levels['dictee']);
    }
  }, [student]);

  useEffect(() => {
    async function loadLists() {
      setIsLoadingLists(true);
      const lists = await getSpellingLists();
      setAvailableLists(lists);
      setIsLoadingLists(false);
    }
    loadLists();
  }, []);

  const currentWord = useMemo(() => words[currentWordIndex] || '', [words, currentWordIndex]);

  const handleSpeak = useCallback(async (text: string) => {
    if (!text) return;
    setIsGeneratingAudio(true);
    try {
      const result = await generateSpeech(text);
      const audio = new Audio(result.audioDataUri);
      audio.play();
    } catch (e) {
      console.error("Audio generation failed:", e);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, []);
  
  // Speak the word when it changes
  useEffect(() => {
    if (currentWord) {
      handleSpeak(currentWord);
    }
  }, [currentWord, handleSpeak]);

  const handleNextQuestion = useCallback(() => {
    setShowConfetti(false);
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsFinished(true);
    }
  }, [currentWordIndex, words.length]);
  
  const checkAnswer = () => {
    if (!currentWord || feedback) return;
    
    const isCorrect = level === 'B' 
      ? normalizeText(userInput) === normalizeText(currentWord)
      : userInput.trim() === currentWord;

    const detail: ScoreDetail = {
      question: `Écrire le mot : "${currentWord}"`,
      userAnswer: userInput,
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
    setTimeout(handleNextQuestion, 2000);
  };
  
  useEffect(() => {
      const saveResult = async () => {
           if (isFinished && student && !hasBeenSaved) {
              setHasBeenSaved(true);
              const score = (correctAnswers / words.length) * 100;
              if (isHomework && homeworkDate) {
                  await saveHomeworkResult({ userId: student.id, date: homeworkDate, skillSlug: 'dictee', score });
              } else {
                  await addScore({ userId: student.id, skill: 'dictee', score, details: sessionDetails, numberLevelSettings: { level } });
              }
          }
      }
      saveResult();
  }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, level, isHomework, homeworkDate, words.length]);

  const handleStartExercise = (listId: string) => {
    const list = availableLists.find(l => l.id === listId);
    if (!list) return;
    setSelectedList(list);
    setWords(list.words.sort(() => Math.random() - 0.5));
  };
  
  const restartExercise = () => {
    setSelectedList(null);
    setWords([]);
    setCurrentWordIndex(0);
    setUserInput('');
    setFeedback(null);
    setIsFinished(false);
    setCorrectAnswers(0);
    setShowConfetti(false);
    setHasBeenSaved(false);
    setSessionDetails([]);
  };

  // ----- RENDER LOGIC -----

  if (isLoadingLists) {
    return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /> Chargement des listes...</Card>;
  }

  if (!selectedList) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Choisir une liste de mots</CardTitle>
          <CardDescription className="text-center">Choisis une liste pour commencer la dictée.</CardDescription>
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

  if (isFinished) {
    const score = words.length > 0 ? (correctAnswers / words.length) * 100 : 0;
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
        <CardHeader><CardTitle className="text-4xl font-headline mb-4">Dictée terminée !</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> mots corrects sur <span className="font-bold">{words.length}</span>.
          </p>
          <ScoreTube score={score} />
          <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4"><RefreshCw className="mr-2" />Recommencer</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Progress value={((currentWordIndex + 1) / words.length) * 100} className="w-full mb-4" />
        <Card className="shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
          </div>

          <CardHeader>
            <CardTitle className="font-headline text-2xl">Écris le mot dicté</CardTitle>
            <CardDescription>Mot {currentWordIndex + 1} sur {words.length}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[250px] flex flex-col items-center justify-center gap-8 p-6">
            <Button onClick={() => handleSpeak(currentWord)} disabled={isGeneratingAudio}>
              {isGeneratingAudio ? <Loader2 className="animate-spin mr-2"/> : <Volume2 className="mr-2"/>}
              Écouter le mot
            </Button>
            <div className="relative w-full max-w-sm">
              <Input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="Écris ici..."
                className={cn("h-20 text-4xl text-center font-body",
                  feedback === 'correct' && 'border-green-500 ring-green-500',
                  feedback === 'incorrect' && 'border-red-500 ring-red-500 animate-shake'
                )}
                disabled={!!feedback}
                autoFocus
              />
              {feedback === 'correct' && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-green-500"/>}
              {feedback === 'incorrect' && <X className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-red-500"/>}
            </div>
          </CardContent>
          <CardFooter className="h-24 flex items-center justify-center">
            {feedback === 'incorrect' && <p className="text-xl font-bold text-red-600 animate-shake">La bonne réponse était : {currentWord}</p>}
          </CardFooter>
        </Card>
      </div>

      {level === 'B' && (
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Mots de la dictée</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-lg font-body">
              {words.map(word => <li key={word}>{word}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
