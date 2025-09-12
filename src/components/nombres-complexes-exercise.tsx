
'use client';

import { useState, useEffect, useMemo, useContext, useRef } from 'react';
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
import { generateSpeech } from '@/ai/flows/tts-flow';

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
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

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

  const handleSpeak = async (text: string) => {
    if (!text || isGeneratingAudio) return;
    if (audioCache[text]) {
      new Audio(audioCache[text]).play();
      return;
    }
    setIsGeneratingAudio(true);
    try {
      const result = await generateSpeech(text);
      setAudioCache(prev => ({...prev, [text]: result.audioDataUri }));
      new Audio(result.audioDataUri).play();
    } catch (e) {
      console.error("Audio generation failed", e);
    } finally {
      setIsGeneratingAudio(false);
    }
  }

  const handleNextQuestion = () => {
    setShowConfetti(false);
    if (currentQuestionIndex < NUM_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsFinished(true);
    }
  };

  const checkAnswer = (answer: string) => {
    if (!currentQuestion || feedback) return;
    
    const isCorrect = answer.trim().toLowerCase() === currentQuestion.answer?.toLowerCase();
    
    const detail: ScoreDetail = {
      question: currentQuestion.question,
      userAnswer: answer,
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
          <div className="flex flex-col items-center gap-6">
            <Button onClick={() => handleSpeak(currentQuestion.textToSpeak!)} disabled={isGeneratingAudio}>
              <Volume2 className="mr-2"/> Écouter le nombre
            </Button>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options?.map(opt => (
                <Button key={opt} variant="outline" className="h-20 text-3xl" onClick={() => checkAnswer(opt)} disabled={!!feedback}>
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        );
      case 'audio-to-text-input':
        return (
          <div className="flex flex-col items-center gap-6">
             <Button onClick={() => handleSpeak(currentQuestion.textToSpeak!)} disabled={isGeneratingAudio}>
              <Volume2 className="mr-2"/> Écouter le nombre
            </Button>
             <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer(userInput)}
                placeholder="Ta réponse..."
                className="h-20 text-4xl text-center font-numbers w-48"
                disabled={!!feedback}
                autoFocus
              />
          </div>
        );
      case 'written-to-audio-qcm':
        return (
           <div className="flex flex-col items-center gap-6">
              <p className="font-numbers text-8xl font-bold">{currentQuestion.answer}</p>
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.optionsWithAudio?.map(opt => (
                  <Button key={opt.text} variant="outline" className="h-20 text-xl" onClick={() => { handleSpeak(opt.audio); checkAnswer(opt.text); }} disabled={!!feedback}>
                     <Volume2 className="mr-2"/> Écouter
                  </Button>
                ))}
            </div>
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
        <CardFooter className="h-24 flex items-center justify-center">
            {feedback === 'correct' && (
              <div className="text-2xl font-bold text-green-600 animate-pulse flex items-center gap-2"><Check/> Correct !</div>
            )}
            {feedback === 'incorrect' && (
              <div className="text-xl font-bold text-red-600 animate-shake">
                Oups ! La bonne réponse était {currentQuestion.answer}.
              </div>
            )}
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
