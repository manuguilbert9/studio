
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, X, RefreshCw } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { Progress } from '@/components/ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { ScoreTube } from './score-tube';

const wordList = [
    { word: "matin", correct: "in" },
    { word: "important", correct: "im" },
    { word: "train", correct: "ain" },
    { word: "peinture", correct: "ein" },
    { word: "lapin", correct: "in" },
    { word: "impossible", correct: "im" },
    { word: "main", correct: "ain" },
    { word: "frein", correct: "ein" },
    { word: "jardin", correct: "in" },
    { word: "timbre", correct: "im" },
    { word: "bain", correct: "ain" },
    { word: "plein", correct: "ein" },
    { word: "chemin", correct: "in" },
    { word: "simple", correct: "im" },
    { word: "pain", correct: "ain" },
    { word: "teint", correct: "ein" },
    { word: "poussin", correct: "in" },
    { word: "grimper", correct: "im" },
];

const shuffleArray = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
}

const NUM_QUESTIONS = 10;

export function SonInExercise() {
    const { student } = useContext(UserContext);
    const searchParams = useSearchParams();
    const isHomework = searchParams.get('from') === 'devoirs';
    const homeworkDate = searchParams.get('date');

    const [questions, setQuestions] = useState<{ word: string; correct: string; }[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    
    useEffect(() => {
        setQuestions(shuffleArray([...wordList]).slice(0, NUM_QUESTIONS));
    }, []);

    const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

    const handleNextQuestion = () => {
        setShowConfetti(false);
        if (currentQuestionIndex < NUM_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setFeedback(null);
        } else {
            setIsFinished(true);
        }
    };
    
    const checkAnswer = (selectedOption: 'in' | 'im' | 'ain' | 'ein') => {
        if (feedback) return;

        const isCorrect = selectedOption === currentQuestion.correct;
        const detail: ScoreDetail = {
            question: currentQuestion.word.replace(currentQuestion.correct, `__`),
            userAnswer: selectedOption,
            correctAnswer: currentQuestion.correct,
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
      const saveFinalScore = async () => {
           if (isFinished && student && !hasBeenSaved) {
              setHasBeenSaved(true);
              const score = (correctAnswers / NUM_QUESTIONS) * 100;
              if (isHomework && homeworkDate) {
                await saveHomeworkResult({
                    userId: student.id,
                    date: homeworkDate,
                    skillSlug: 'son-in',
                    score: score
                });
              } else {
                await addScore({
                    userId: student.id,
                    skill: 'son-in',
                    score: score,
                    details: sessionDetails,
                });
              }
          }
      }
      saveFinalScore();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, isHomework, homeworkDate]);

    const restartExercise = () => {
        setQuestions(shuffleArray([...wordList]).slice(0, NUM_QUESTIONS));
        setIsFinished(false);
        setCorrectAnswers(0);
        setCurrentQuestionIndex(0);
        setFeedback(null);
        setHasBeenSaved(false);
        setSessionDetails([]);
    };
    
    if (questions.length === 0) {
        return <div>Chargement...</div>
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
    
    const wordParts = currentQuestion.word.split(currentQuestion.correct);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mb-4" />
            <Card className="shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <Confetti active={showConfetti} config={{ angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px" }} />
                </div>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Complète le mot avec le bon son [in]</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[250px] flex flex-col items-center justify-center gap-8 p-6">
                    <div className="font-body text-6xl font-bold tracking-wider">
                        <span>{wordParts[0]}</span>
                        <span className="inline-block w-24 border-b-4 border-dashed border-muted-foreground align-bottom">
                            {feedback && <span className={cn(feedback === 'correct' ? 'text-green-600' : 'text-red-500')}>{currentQuestion.correct}</span>}
                        </span>
                        <span>{wordParts[1]}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                        {(['in', 'im', 'ain', 'ein'] as const).map(option => (
                             <Button
                                key={option}
                                variant="outline"
                                onClick={() => checkAnswer(option)}
                                className={cn(
                                "text-2xl h-20 p-4 justify-center transition-all duration-300 transform active:scale-95",
                                feedback === 'correct' && option === currentQuestion.correct && 'bg-green-500/80 text-white border-green-600 scale-105',
                                feedback === 'incorrect' && 'bg-red-500/80 text-white border-red-600 animate-shake'
                                )}
                                disabled={!!feedback}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="h-16 flex items-center justify-center">
                    {feedback === 'correct' && <div className="text-2xl font-bold text-green-600 animate-pulse">Parfait !</div>}
                    {feedback === 'incorrect' && <div className="text-2xl font-bold text-red-600 animate-shake">Oups ! Ce n'est pas ça.</div>}
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
        </div>
    );
}
