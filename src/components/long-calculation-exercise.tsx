
'use client';

import { useState, useMemo, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Eye, Loader2, Check, X } from 'lucide-react';
import { AdditionWidget } from '@/components/tableau/addition-widget';
import { SoustractionWidget } from '@/components/tableau/soustraction-widget';
import { UserContext } from '@/context/user-context';
import { addScore } from '@/services/scores';
import { Progress } from '@/components/ui/progress';
import { ScoreTube } from './score-tube';
import { cn } from '@/lib/utils';


type OperationType = 'addition' | 'subtraction';
type Problem = {
    id: number;
    operand1: number;
    operand2: number;
    operation: OperationType;
    answer: number;
}
type Feedback = 'correct' | 'incorrect' | null;

const NUM_PROBLEMS = 3;

export function LongCalculationExercise() {
    const { student } = useContext(UserContext);
    
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [userInputs, setUserInputs] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const generateProblems = () => {
        const newProblems: Problem[] = [];
        for (let i = 0; i < NUM_PROBLEMS; i++) {
            const numCols = 3;
            const max = 10 ** numCols - 1;
            const min = 10 ** (numCols - 1);
            let op1 = Math.floor(Math.random() * (max - min + 1)) + min;
            let op2 = Math.floor(Math.random() * (max - min + 1)) + min;
            const operation: OperationType = Math.random() < 0.5 ? 'addition' : 'subtraction';
            
            if (operation === 'subtraction' && op1 < op2) {
                [op1, op2] = [op2, op1]; // swap
            }
            
            const answer = operation === 'addition' ? op1 + op2 : op1 - op2;

            newProblems.push({ id: i, operand1: op1, operand2: op2, operation, answer });
        }
        setProblems(newProblems);
    };

    useEffect(() => {
        generateProblems();
    }, []);

    const currentProblem = useMemo(() => {
        if (problems.length > 0) {
            return problems[currentProblemIndex];
        }
        return null;
    }, [problems, currentProblemIndex]);

    const handleInputChange = (cellId: string, value: string) => {
        setUserInputs(prev => ({
            ...prev,
            [cellId]: value
        }));
    };

    const handleValidate = () => {
        if (!currentProblem) return;

        // Construct the user's answer from input cells
        const numCols = String(currentProblem.operand1).length;
        let userAnswerStr = '';
        for (let i = numCols; i >= 0; i--) {
            userAnswerStr += userInputs[`result-${i}`] || '';
        }
        const userAnswerNum = parseInt(userAnswerStr, 10) || 0;

        if (userAnswerNum === currentProblem.answer) {
            setFeedback('correct');
            setCorrectAnswers(prev => prev + 1);
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            if (currentProblemIndex < NUM_PROBLEMS - 1) {
                setCurrentProblemIndex(prev => prev + 1);
                setUserInputs({});
                setFeedback(null);
            } else {
                setIsFinished(true);
            }
        }, 2000);
    };

    useEffect(() => {
        const saveFinalScore = async () => {
             if (isFinished && student && !isSaving) {
                setIsSaving(true);
                const score = (correctAnswers / NUM_PROBLEMS) * 100;
                await addScore({
                    userId: student.id,
                    skill: 'long-calculation',
                    score: score,
                });
                setIsSaving(false);
            }
        }
        saveFinalScore();
    }, [isFinished, student, correctAnswers, isSaving]);


    const restartExercise = () => {
        generateProblems();
        setCurrentProblemIndex(0);
        setUserInputs({});
        setFeedback(null);
        setIsFinished(false);
        setCorrectAnswers(0);
    };


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
                    <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                        <RefreshCw className="mr-2" />
                        Recommencer
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!currentProblem) {
        return (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-6 h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Génération des calculs...</p>
            </div>
        );
    }
    
    const { operand1, operand2, operation } = currentProblem;
    const symbol = operation === 'addition' ? '+' : '-';

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
            <Progress value={((currentProblemIndex + 1) / NUM_PROBLEMS) * 100} className="w-full" />
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center font-body text-2xl sm:text-3xl">
                        Pose et calcule : <span className="font-numbers font-bold text-primary">{operand1} {symbol} {operand2}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center scale-125 transform">
                        {operation === 'addition' ? (
                             <AdditionWidget
                                initialState={{ id: 1, pos: {x:0, y:0}, size: {width: 450, height: 300}, numOperands: 2, numCols: 3 }}
                                onUpdate={()=>{}}
                                onClose={()=>{}}
                                isExerciseMode={true}
                                exerciseInputs={userInputs}
                                onInputChange={handleInputChange}
                                feedback={feedback}
                             />
                        ) : (
                             <SoustractionWidget
                                initialState={{ id: 1, pos: {x:0, y:0}, size: {width: 450, height: 300}, numCols: 3 }}
                                onUpdate={()=>{}}
                                onClose={()=>{}}
                                isExerciseMode={true}
                                exerciseInputs={userInputs}
                                onInputChange={handleInputChange}
                                feedback={feedback}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <div className="w-full">
                <Button onClick={handleValidate} size="lg" className={cn("w-full text-lg",
                    feedback === 'correct' && 'bg-green-500 hover:bg-green-600',
                    feedback === 'incorrect' && 'bg-red-500 hover:bg-red-600',
                )} disabled={!!feedback}>
                    {feedback === 'correct' && <Check className="mr-2"/>}
                    {feedback === 'incorrect' && <X className="mr-2"/>}
                    Valider ma réponse
                </Button>
            </div>
        </div>
    );
}
