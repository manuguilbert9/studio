

'use client';

import { useState, useMemo, useEffect, useContext, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Loader2, Check, X } from 'lucide-react';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { Progress } from './ui/progress';
import { ScoreTube } from './score-tube';
import { cn } from '@/lib/utils';

type Problem = {
    id: number;
    operands: number[];
    answer: number;
    emoji: string;
};
type Feedback = 'correct' | 'incorrect' | null;

const NUM_PROBLEMS = 5;
const emojiPool = ['🧱', '🍎', '🚗', '⭐', '🧸', '⚽', '🍓', '🍌', '🔵', '🟢'];

const generateProblem = (): Problem => {
    const op1 = Math.floor(Math.random() * 8) + 1; // 1-8
    const op2 = Math.floor(Math.random() * (9 - op1)) + 1; // ensure total is < 10
    const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
    return { id: Date.now() + Math.random(), operands: [op1, op2], answer: op1 + op2, emoji };
}

export function SommeDixExercise() {
    const { student } = useContext(UserContext);
    const searchParams = useSearchParams();
    const isHomework = searchParams.get('from') === 'devoirs';
    const homeworkDate = searchParams.get('date');
    
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);

    
    useEffect(() => {
        generateNewProblems();
    }, []);

    const generateNewProblems = () => {
        setIsLoading(true);
        const newProblems: Problem[] = [];
        for (let i = 0; i < NUM_PROBLEMS; i++) {
            newProblems.push(generateProblem());
        }
        setProblems(newProblems);
        setIsLoading(false);
    };

    const currentProblem = useMemo(() => {
        if (problems.length > 0) {
            return problems[currentProblemIndex];
        }
        return null;
    }, [problems, currentProblemIndex]);

    const handleNextProblem = useCallback(() => {
        if (currentProblemIndex < NUM_PROBLEMS - 1) {
            setCurrentProblemIndex(prev => prev + 1);
            setUserAnswer('');
            setFeedback(null);
        } else {
            setIsFinished(true);
        }
    }, [currentProblemIndex]);
    
    const checkAnswer = (answer: string) => {
        if (!currentProblem || feedback) return;

        const isCorrect = parseInt(answer, 10) === currentProblem.answer;

        const detail: ScoreDetail = {
            question: `${currentProblem.operands[0]} + ${currentProblem.operands[1]}`,
            userAnswer: answer,
            correctAnswer: String(currentProblem.answer),
            status: isCorrect ? 'correct' : 'incorrect',
        };
        setSessionDetails(prev => [...prev, detail]);

        if (isCorrect) {
            setFeedback('correct');
            setCorrectAnswers(prev => prev + 1);
        } else {
            setFeedback('incorrect');
        }

        setTimeout(handleNextProblem, 1500);
    }

    const handleKeystroke = (key: string) => {
        if(feedback) return;

        let newAnswer = userAnswer;
        if (key === 'Backspace' || key === '⌫') { // Backspace
            newAnswer = newAnswer.slice(0, -1);
        } else if (/^\d$/.test(key) && newAnswer.length < 2) {
            newAnswer += key;
        }
        setUserAnswer(newAnswer);

        if (newAnswer.length > 0 && newAnswer.length === String(currentProblem?.answer).length) {
            setTimeout(() => checkAnswer(newAnswer), 100);
        }
    };
    
    const handlePhysicalKeystroke = (e: KeyboardEvent) => {
        if (e.key >= '0' && e.key <= '9') {
            handleKeystroke(e.key);
        } else if (e.key === 'Backspace') {
            handleKeystroke('⌫');
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handlePhysicalKeystroke);
        return () => {
            document.removeEventListener('keydown', handlePhysicalKeystroke);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userAnswer, feedback]);


    useEffect(() => {
        const saveFinalScore = async () => {
             if (isFinished && student && !hasBeenSaved) {
                setHasBeenSaved(true);
                const score = (correctAnswers / NUM_PROBLEMS) * 100;
                if (isHomework && homeworkDate) {
                    await saveHomeworkResult({
                        userId: student.id,
                        date: homeworkDate,
                        skillSlug: 'somme-dix',
                        score: score,
                    });
                } else {
                    await addScore({
                        userId: student.id,
                        skill: 'somme-dix',
                        score: score,
                        numberLevelSettings: { level: 'A' },
                        details: sessionDetails,
                    });
                }
            }
        }
        saveFinalScore();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, isHomework, homeworkDate]);

    const restartExercise = () => {
        generateNewProblems();
        setCurrentProblemIndex(0);
        setUserAnswer('');
        setFeedback(null);
        setIsFinished(false);
        setCorrectAnswers(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
    };
    
     if (isLoading) {
        return (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-6 h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (isFinished) {
        const score = (correctAnswers / NUM_PROBLEMS) * 100;
        return (
             <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-2xl">
                        Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{NUM_PROBLEMS}</span>.
                    </p>
                    <ScoreTube score={score} />
                    {isHomework ? (
                        <p className="text-muted-foreground">Tes devoirs sont terminés !</p>
                     ) : (
                        <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                            <RefreshCw className="mr-2" />
                            Recommencer
                        </Button>
                     )}
                </CardContent>
            </Card>
        )
    }

    if (!currentProblem) {
        return <p>Erreur lors de la génération du problème.</p>;
    }
    
    return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
            <Progress value={((currentProblemIndex + 1) / NUM_PROBLEMS) * 100} className="w-full" />
            <Card className="w-full">
                <CardHeader>
                     <CardTitle className="text-center font-body text-2xl sm:text-3xl">
                        Combien y a-t-il d'objets en tout ?
                    </CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center gap-4 sm:gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl flex flex-wrap gap-1 justify-center max-w-[150px]">
                                {Array.from({ length: currentProblem.operands[0] }).map((_, i) => <span key={i}>{currentProblem.emoji}</span>)}
                            </div>
                            <p className="text-3xl font-bold">{currentProblem.operands[0]}</p>
                        </div>
                        <span className="text-5xl font-bold text-primary">+</span>
                         <div className="flex flex-col items-center gap-2">
                           <div className="text-4xl flex flex-wrap gap-1 justify-center max-w-[150px]">
                                {Array.from({ length: currentProblem.operands[1] }).map((_, i) => <span key={i}>{currentProblem.emoji}</span>)}
                            </div>
                            <p className="text-3xl font-bold">{currentProblem.operands[1]}</p>
                        </div>
                    </div>
                     <div className={cn("relative w-48 h-24 border-2 rounded-lg flex items-center justify-center",
                        feedback === 'correct' && 'border-green-500',
                        feedback === 'incorrect' && 'border-red-500 animate-shake'
                     )}>
                        <span className="font-bold text-6xl">{userAnswer}</span>
                         {feedback === 'correct' && <Check className="absolute right-2 top-2 h-6 w-6 text-green-500"/>}
                         {feedback === 'incorrect' && <X className="absolute right-2 top-2 h-6 w-6 text-red-500"/>}
                         {!feedback && <span className="absolute bottom-2 text-muted-foreground text-xs">Tape ta réponse</span>}
                         {feedback === 'incorrect' && <span className="absolute bottom-2 text-red-500 text-xs font-bold">Réponse: {currentProblem.answer}</span>}

                     </div>
                </CardContent>
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
    )
}
