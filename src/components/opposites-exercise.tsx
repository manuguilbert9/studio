

'use client';

import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Check, X, Send } from 'lucide-react';
import { getAntonymPairs } from '@/services/vocabulary';
import type { AntonymEntry } from '@/services/vocabulary.types';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import Confetti from 'react-dom-confetti';
import { UserContext } from '@/context/user-context';
import { addScore } from '@/services/scores';
import { ScoreTube } from './score-tube';

type QuestionType = 'qcm-2' | 'qcm-4' | 'input';
type Difficulty = 0 | 1 | 2; // 0: qcm-2, 1: qcm-4, 2: input
type FeedbackState = 'correct' | 'incorrect' | null;

interface Question {
  word: string;
  answer: string;
  options?: string[];
  type: QuestionType;
}

const NUM_QUESTIONS = 10;

const difficultyDesc = [
  "Niveau 1 : Choisir entre 2 mots",
  "Niveau 2 : Choisir entre 4 mots",
  "Niveau 3 : Écrire le contraire",
];

const questionTypes: QuestionType[] = ['qcm-2', 'qcm-4', 'input'];

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


export function OppositesExercise() {
  const { student } = useContext(UserContext);
  const [allEntries, setAllEntries] = useState<AntonymEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isStarted, setIsStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(0);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadPairs() {
      setIsLoading(true);
      const entries = await getAntonymPairs();
      setAllEntries(entries);
      setIsLoading(false);
    }
    loadPairs();
  }, []);

  const generateQuestions = (difficulty: Difficulty) => {
    if (allEntries.length === 0) return;

    const questionType = questionTypes[difficulty];
    const shuffledEntries = [...allEntries].sort(() => 0.5 - Math.random());
    const selectedEntries = shuffledEntries.slice(0, NUM_QUESTIONS);
    
    const newQuestions = selectedEntries.map(entry => {
      const question: Question = {
        word: entry.word,
        answer: entry.opposite,
        type: questionType,
      };

      if (questionType === 'qcm-2' || questionType === 'qcm-4') {
        const numOptions = questionType === 'qcm-2' ? 2 : 4;
        let options = new Set<string>([entry.opposite]);
        
        const availableDistractors = [...entry.distractors];
        while (options.size < numOptions && availableDistractors.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableDistractors.length);
            options.add(availableDistractors.splice(randomIndex, 1)[0]);
        }
        
        // If we still don't have enough options from the entry's distractors,
        // grab some from other entries (as a fallback)
        const otherOpposites = allEntries.map(e => e.opposite).filter(o => !options.has(o) && o !== entry.opposite);
         while (options.size < numOptions && otherOpposites.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherOpposites.length);
            options.add(otherOpposites.splice(randomIndex, 1)[0]);
        }

        question.options = shuffleArray(Array.from(options));
      }
      return question;
    });

    setQuestions(newQuestions);
  };
  
  const startExercise = () => {
    generateQuestions(selectedDifficulty);
    setIsStarted(true);
  }

  const handleAnswer = (answer: string) => {
    if (feedback) return;

    const isCorrect = answer.trim().toLowerCase() === questions[currentQuestionIndex].answer.toLowerCase();
    
    if (isCorrect) {
      setFeedback('correct');
      setCorrectAnswers(prev => prev + 1);
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      if (currentQuestionIndex < NUM_QUESTIONS - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setFeedback(null);
        setUserInput('');
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

   const saveFinalScore = useCallback(async () => {
      if (isFinished && student && !isSaving) {
        setIsSaving(true);
        const scoreValue = (correctAnswers / NUM_QUESTIONS) * 100;
        await addScore({
          userId: student.id,
          skill: 'opposites',
          score: scoreValue,
          // We can add settings later if needed
        });
        setIsSaving(false);
      }
    }, [isFinished, student, isSaving, correctAnswers]);

    useEffect(() => {
        if (isFinished) {
            saveFinalScore();
        }
    }, [isFinished, saveFinalScore]);

  const restartExercise = () => {
    setIsStarted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserInput('');
    setFeedback(null);
    setCorrectAnswers(0);
    setIsFinished(false);
  };
  
  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

  if (isLoading) {
    return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /> Chargement...</Card>;
  }

  if (allEntries.length === 0) {
     return <Card className="w-full shadow-2xl p-8 text-center text-destructive">Impossible de charger le fichier "contraires.txt". Veuillez vérifier qu'il se trouve dans le dossier public/vocabulaire.</Card>;
  }

  if (!isStarted) {
    return (
       <Card className="w-full max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Exercice des Contraires</CardTitle>
          <CardDescription className="text-center">Choisis ton niveau de difficulté.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-10 p-8">
          <div className="space-y-4">
            <Label htmlFor="difficulty" className="text-lg">Niveau de difficulté</Label>
            <Slider
              id="difficulty"
              min={0}
              max={2}
              step={1}
              value={[selectedDifficulty]}
              onValueChange={(value) => setSelectedDifficulty(value[0] as Difficulty)}
            />
            <p className="text-center text-muted-foreground font-medium">{difficultyDesc[selectedDifficulty]}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={startExercise} size="lg" className="w-full text-xl py-7">
            Commencer l'exercice !
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (isFinished) {
     const score = (correctAnswers / NUM_QUESTIONS) * 100;
     return (
        <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
            <CardHeader>
                <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <p className="text-2xl">
                    Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{NUM_QUESTIONS}</span>.
                </p>
                <ScoreTube score={score} />
                <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                    <RefreshCw className="mr-2" />
                    Recommencer
                </Button>
            </CardContent>
        </Card>
     )
  }

  if (!currentQuestion) {
     return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /> Chargement des questions...</Card>;
  }


  return (
     <Card className="w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Confetti active={feedback === 'correct'} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 70, duration: 2000, stagger: 3}} />
        </div>
        <CardHeader>
             <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mb-4 h-3" />
             <CardTitle className="font-headline text-3xl text-center">
                Quel est le contraire de "{currentQuestion.word}" ?
             </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[250px] flex flex-col items-center justify-center space-y-8 p-6">
            {currentQuestion.type.startsWith('qcm') && (
                <div className={cn(
                    "grid w-full max-w-lg gap-4",
                    currentQuestion.type === 'qcm-4' ? "grid-cols-2" : "grid-cols-1"
                )}>
                    {currentQuestion.options?.map((option, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            onClick={() => handleAnswer(option)}
                            disabled={!!feedback}
                            className={cn("text-xl h-20 p-4 justify-center transition-all duration-300 transform active:scale-95",
                                feedback === 'correct' && option === currentQuestion.answer && 'bg-green-500/80 text-white border-green-600 scale-105',
                                feedback === 'incorrect' && option !== currentQuestion.answer && 'opacity-50',
                                feedback === 'incorrect' && option === userInput && 'bg-red-500/80 text-white border-red-600 animate-shake',
                            )}
                        >
                             <span className="flex items-center gap-4">
                                {feedback === 'correct' && option === currentQuestion.answer && <Check />}
                                {option}
                            </span>
                        </Button>
                    ))}
                </div>
            )}
            {currentQuestion.type === 'input' && (
                 <form 
                    onSubmit={(e) => { e.preventDefault(); handleAnswer(userInput); }} 
                    className="flex w-full max-w-sm items-center space-x-2"
                >
                    <Input
                        type="text"
                        placeholder="Écris le contraire ici..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={!!feedback}
                        className={cn("h-14 text-2xl text-center",
                            feedback === 'correct' && 'border-green-500 ring-green-500',
                            feedback === 'incorrect' && 'border-red-500 ring-red-500 animate-shake'
                        )}
                    />
                    <Button type="submit" size="icon" className="h-14 w-14" disabled={!!feedback}>
                        <Send />
                    </Button>
                </form>
            )}
        </CardContent>
         <CardFooter className="h-24 flex items-center justify-center">
            {feedback === 'correct' && (
                <div className="text-2xl font-bold text-green-600 animate-pulse flex items-center gap-2">
                    <Check /> Parfait !
                </div>
            )}
            {feedback === 'incorrect' && (
                <div className="text-2xl font-bold text-red-600 animate-shake flex items-center gap-2">
                    <X /> Oups ! La bonne réponse était "{currentQuestion.answer}".
                </div>
            )}
        </CardFooter>
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
     </Card>
  )
}
