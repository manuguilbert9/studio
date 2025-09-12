
'use client';

import { useState, useEffect, useMemo, useContext, useRef, useCallback } from 'react';
import type { SkillLevel } from '@/lib/skills';
import { useSearchParams } from 'next/navigation';
import { generateNombresComplexesQuestion } from '@/lib/complex-number-questions';
import type { Question } from '@/lib/questions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const NUM_QUESTIONS = 10;

export function NombresComplexesExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchQuestions() {
        setIsLoading(true);
        const newQuestions: Question[] = [];
        for (let i = 0; i < NUM_QUESTIONS; i++) {
            newQuestions.push(await generateNombresComplexesQuestion());
        }
        setQuestions(newQuestions);
        setIsLoading(false);
    }
    fetchQuestions();
  }, []);

  const currentQuestion = useMemo(() => {
    if (questions.length > 0) {
      return questions[currentQuestionIndex];
    }
    return null;
  }, [questions, currentQuestionIndex]);

  const handleSpeak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleNextQuestion = () => {
    setShowConfetti(false);
    if (currentQuestionIndex < NUM_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserInput('');
      setSelectedOption(null);
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsFinished(true);
    }
  };
  
  const checkAnswer = () => {
    if (!currentQuestion || feedback) return;

    let userAnswer: string;
    let isCorrect = false;

    if (currentQuestion.type === 'audio-to-text-input') {
        userAnswer = userInput;
        isCorrect = userAnswer.trim() === currentQuestion.answer;
    } else {
        userAnswer = selectedOption || '';
        isCorrect = userAnswer === currentQuestion.answer;
    }

    const detail: ScoreDetail = {
      question: currentQuestion.question,
      userAnswer: userAnswer,
      correctAnswer: currentQuestion.answer || 'N/A',
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
    setTimeout(handleNextQuestion, 1500);
  };
  
  useEffect(() => {
    const saveResult = async () => {
      if (isFinished && student && !hasBeenSaved) {
        setHasBeenSaved(true);
        const score = (correctAnswers / NUM_QUESTIONS) * 100;
        if (isHomework && homeworkDate) {
          await saveHomeworkResult({
            userId: student.id,
            date: homeworkDate,
            skillSlug: 'nombres-complexes',
            score: score,
          });
        } else {
          await addScore({
            userId: student.id,
            skill: 'nombres-complexes',
            score: score,
            details: sessionDetails,
            numberLevelSettings: { level: 'B' }
          });
        }
      }
    };
    saveResult();
  }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, isHomework, homeworkDate]);

  const restartExercise = () => {
    // Re-generate questions
    setIsLoading(true);
    const newQuestions: Promise<Question>[] = [];
    for (let i = 0; i < NUM_QUESTIONS; i++) {
        newQuestions.push(generateNombresComplexesQuestion());
    }
    Promise.all(newQuestions).then(qs => {
        setQuestions(qs);
        setIsLoading(false);
        setIsFinished(false);
        setCorrectAnswers(0);
        setCurrentQuestionIndex(0);
        setUserInput('');
        setSelectedOption(null);
        setFeedback(null);
        setHasBeenSaved(false);
        setSessionDetails([]);
    });
  };

  const renderQuestion = () => {
    if(!currentQuestion) return null;

    switch(currentQuestion.type) {
      case 'audio-qcm':
        return (
          <div className="flex flex-col items-center gap-6 w-full">
            <Button onClick={() => handleSpeak(currentQuestion.textToSpeak!)}>
              <Volume2 className="mr-2"/> Écouter le nombre
            </Button>
            <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''} className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {currentQuestion.options?.map(opt => (
                <div key={opt}>
                    <RadioGroupItem value={opt} id={opt} className="sr-only" />
                    <Label htmlFor={opt} className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-20 text-3xl font-numbers", selectedOption === opt && 'border-primary')}>
                       {opt}
                    </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case 'audio-to-text-input':
        return (
          <div className="flex flex-col items-center gap-6">
             <Button onClick={() => handleSpeak(currentQuestion.textToSpeak!)}>
              <Volume2 className="mr-2"/> Écouter le nombre
            </Button>
             <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="Ta réponse..."
                className="h-20 text-4xl text-center font-numbers w-48"
                disabled={!!feedback}
                autoFocus
              />
          </div>
        );
      case 'written-to-audio-qcm':
        return (
           <div className="flex flex-col items-center gap-6 w-full">
              <p className="font-numbers text-8xl font-bold">{currentQuestion.answer}</p>
              <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''} className="grid grid-cols-2 gap-4 w-full max-w-md">
                {currentQuestion.optionsWithAudio?.map(opt => (
                    <div key={opt.text}>
                        <RadioGroupItem value={opt.text} id={opt.text} className="sr-only" />
                        <Label htmlFor={opt.text} className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-20 text-xl", selectedOption === opt.text && 'border-primary')}>
                             <Button variant="ghost" size="icon" className="h-12 w-12" onClick={(e) => { e.preventDefault(); handleSpeak(opt.audio); }}>
                                 <Volume2 className="h-8 w-8 text-muted-foreground" />
                             </Button>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
           </div>
        );
      default:
        return <p>Type de question non supporté.</p>;
    }
  }


  if (isLoading || !currentQuestion) {
    return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /></Card>;
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
          {isHomework ? (
            <p className="text-muted-foreground">Tes devoirs sont terminés !</p>
          ) : (
            <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
              <RefreshCw className="mr-2" /> Recommencer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mb-4" />
      <Card className="shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
        </div>

        <CardHeader>
            <CardTitle className="font-headline text-2xl">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[250px] flex flex-col items-center justify-center gap-8 p-6">
          {renderQuestion()}
        </CardContent>
        <CardFooter className="h-24 flex flex-col items-center justify-center">
            {currentQuestion.type !== 'audio-to-text-input' && (
              <Button onClick={checkAnswer} disabled={!selectedOption || !!feedback}>
                Valider
              </Button>
            )}
            <div className="pt-4">
              {feedback === 'correct' && (
                <div className="text-2xl font-bold text-green-600 animate-pulse flex items-center gap-2"><Check/> Correct !</div>
              )}
              {feedback === 'incorrect' && (
                <div className="text-xl font-bold text-red-600 animate-shake">
                  Oups ! La bonne réponse était {currentQuestion.answer}.
                </div>
              )}
            </div>
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
  );
}
