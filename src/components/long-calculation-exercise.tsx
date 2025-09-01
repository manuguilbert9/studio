
'use client';

import { useState, useMemo, useEffect, useContext } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Loader2, Check, X } from 'lucide-react';
import { AdditionWidget } from '@/components/tableau/addition-widget';
import { SoustractionWidget } from '@/components/tableau/soustraction-widget';
import { UserContext } from '@/context/user-context';
import { addScore } from '@/services/scores';
import { Progress } from '@/components/ui/progress';
import { ScoreTube } from './score-tube';
import { cn } from '@/lib/utils';
import type { SkillLevel } from '@/lib/skills';
import { Input } from './ui/input';


type OperationType = 'addition' | 'subtraction' | 'count';
type Problem = {
    id: number;
    operands: number[];
    operation: OperationType;
    answer: number;
    noCarry?: boolean; // for subtractions
};
type Feedback = 'correct' | 'incorrect' | null;

const NUM_PROBLEMS = 3;

// --- Problem Generation Logic ---

const generateNumber = (digits: number, noLeadingZero = true) => {
    // This ensures a number with an exact number of digits.
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateAddition = (numOperands: number, digits: number, withCarry: boolean): Problem => {
    let operands: number[] = [];
    
    if (!withCarry) {
         let columnSums = Array(digits).fill(0);
         for(let i=0; i < numOperands; i++) {
            let operandStr = '';
            for(let d=0; d < digits; d++) {
                const maxDigit = 9 - columnSums[d];
                const digit = Math.floor(Math.random() * (maxDigit + 1));
                operandStr = String(digit) + operandStr;
                columnSums[d] += digit;
            }
            operands.push(parseInt(operandStr, 10));
         }

    } else {
        // Ensure at least one carry for withCarry=true
        let hasCarry = false;
        let attempts = 0;
        while (!hasCarry && attempts < 20) {
            attempts++;
            operands = Array.from({ length: numOperands }, () => generateNumber(digits));
            let tempSum = 0;
            for (let d = 0; d < digits; d++) {
                const colSum = operands.reduce((acc, op) => acc + (Math.floor(op / Math.pow(10, d)) % 10), 0);
                if (colSum >= 10) {
                    hasCarry = true;
                    break;
                }
            }
             // If we're on the last loop and there's still no carry, force one.
            if (!hasCarry && attempts > 15 && digits > 1) { 
                const op1Str = String(operands[0]);
                const op2Str = String(operands[1]);
                const unit1 = Number(op1Str[op1Str.length - 1]);
                const unit2 = Number(op2Str[op2Str.length - 1]);
                if (unit1 + unit2 < 10) {
                    const newUnit2 = 10 - unit1; // Force a carry
                    operands[1] = Math.floor(operands[1] / 10) * 10 + newUnit2;
                    hasCarry = true; // We've forced it
                }
            }
        }
    }
    
    const sum = operands.reduce((acc, op) => acc + op, 0);
    return { id: Date.now() + Math.random(), operands, operation: 'addition', answer: sum };
};


const generateSubtraction = (digits: number, withCarry: boolean): Problem => {
    let op1: number, op2: number;
    let needsCarry = false;
    let attempts = 0;

    while(!needsCarry && attempts < 50) { // Increased attempts for safety
        attempts++;
        op1 = generateNumber(digits);

        // Ensure op2 is also `digits` long and op1 > op2
        const minOp2 = Math.pow(10, digits - 1);
        const maxOp2 = op1 - 1;
        if (maxOp2 < minOp2) continue; // op1 is too small, retry
        
        op2 = Math.floor(Math.random() * (maxOp2 - minOp2 + 1)) + minOp2;
        
        if (withCarry) {
            let op1Str = op1.toString();
            let op2Str = op2.toString().padStart(digits, '0');

            for (let i = 0; i < digits; i++) {
                 const digit1 = parseInt(op1Str[op1Str.length - 1 - i] || '0');
                 const digit2 = parseInt(op2Str[op2Str.length - 1 - i] || '0');
                if (digit1 < digit2) {
                    needsCarry = true;
                    break;
                }
            }
        } else { // No carry logic
            let op1Str = '', op2Str = '';
             let isValid = true;
            for (let i = digits -1; i >= 0; i--) {
                const d1 = Math.floor(Math.random() * 8) + 1; // 1-8 to avoid all 9s
                const d2 = Math.floor(Math.random() * (d1 + 1)); // 0-d1
                op1Str += String(d1);
                op2Str += String(d2);
            }
            op1 = parseInt(op1Str, 10);
            op2 = parseInt(op2Str, 10);
            needsCarry = true; // Exit loop for no-carry case
        }
    }
     if (!needsCarry && withCarry) { // Fallback if no carry subtraction is found
        op1 = 143;
        op2 = 129;
    }
    return { id: Date.now() + Math.random(), operands: [op1, op2], operation: 'subtraction', answer: op1 - op2 };
};


export function LongCalculationExercise() {
    const { student } = useContext(UserContext);
    const [level, setLevel] = useState<SkillLevel | null>(null);
    
    const [problems, setProblems] = useState<Problem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [userInputs, setUserInputs] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userCount, setUserCount] = useState('');

    const generateProblemsForLevel = (lvl: SkillLevel) => {
        let newProblems: Problem[] = [];
        switch (lvl) {
            case 'A': // Counting cubes
                for (let i = 0; i < NUM_PROBLEMS; i++) {
                    const op1 = Math.floor(Math.random() * 8) + 1; // 1-8
                    const op2 = Math.floor(Math.random() * (15 - op1 - 1)) + 1; // ensure total < 15
                    newProblems.push({ id: i, operands: [op1, op2], operation: 'count', answer: op1 + op2 });
                }
                break;
            case 'B':
                newProblems = [
                    generateAddition(2, 2, false),
                    generateSubtraction(2, false),
                    generateAddition(2, 2, true)
                ];
                break;
            case 'C':
                 newProblems = [
                    generateAddition(2, 3, true),
                    generateSubtraction(3, true),
                    generateSubtraction(3, true)
                ];
                break;
            case 'D':
                newProblems = [
                    generateAddition(3, 4, true),
                    generateSubtraction(4, true),
                    generateSubtraction(4, true),
                ];
                break;
        }
        setProblems(newProblems.sort(() => Math.random() - 0.5)); // Shuffle the order
        setIsLoading(false);
    };
    
    useEffect(() => {
        if(level === null && student) {
             const studentLevel = student.levels?.['long-calculation'] || 'B';
             setLevel(studentLevel);
        } else if (level === null && !student) {
             setLevel('B'); // Default level if no student
        }
    }, [student, level]);

    useEffect(() => {
        if (level !== null) {
            setIsLoading(true);
            generateProblemsForLevel(level);
        }
    }, [level]);


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

        let isCorrect = false;
        if (currentProblem.operation === 'count') {
            isCorrect = parseInt(userCount, 10) === currentProblem.answer;
        } else {
            // Reconstruct user's answer from input cells
            const numCols = Math.max(...currentProblem.operands.map(op => String(op).length), String(currentProblem.answer).length);
            let userAnswerStr = '';
            for (let i = numCols; i >= 0; i--) { // Start from potential highest-order column
                 const cellValue = userInputs[`result-${i}`] || '';
                 // Handle borrowed '1' (e.g. "13" -> "3")
                 const cleanValue = cellValue.length === 2 && cellValue.startsWith('1') ? cellValue.substring(1) : cellValue;
                 userAnswerStr += cleanValue;
            }
            const userAnswerNum = parseInt(userAnswerStr, 10) || 0;
            isCorrect = userAnswerNum === currentProblem.answer;
        }


        if (isCorrect) {
            setFeedback('correct');
            setCorrectAnswers(prev => prev + 1);
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            if (currentProblemIndex < NUM_PROBLEMS - 1) {
                setCurrentProblemIndex(prev => prev + 1);
                setUserInputs({});
                setUserCount('');
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
        setIsLoading(true);
        setProblems([]); // This will trigger the useEffect to generate new problems for the current level
        setCurrentProblemIndex(0);
        setUserInputs({});
        setUserCount('');
        setFeedback(null);
        setIsFinished(false);
        setCorrectAnswers(0);
    };

    if (isLoading || !level || problems.length === 0) {
        return (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-6 h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Génération des calculs...</p>
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
                    <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                        <RefreshCw className="mr-2" />
                        Recommencer
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (!currentProblem) {
        return <p>Erreur lors de la génération du problème.</p>;
    }
    
    const { operands, operation } = currentProblem;
    const symbol = operation === 'addition' ? '+' : (operation === 'subtraction' ? '-' : '+');
    const statement = operands.join(` ${symbol} `);

    const renderLevelA = () => {
        return (
            <Card className="w-full">
                <CardHeader>
                     <CardTitle className="text-center font-body text-2xl sm:text-3xl">
                        Combien y a-t-il de cubes en tout ?
                    </CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex items-center justify-center gap-4 sm:gap-8">
                        <div className="flex flex-col items-center">
                            <Image src="/cubes.png" alt="cubes" width={100} height={100} className="object-contain" />
                            <p className="text-2xl font-bold">{operands[0]}</p>
                        </div>
                        <span className="text-4xl font-bold text-primary">+</span>
                         <div className="flex flex-col items-center">
                            <Image src="/cubes.png" alt="cubes" width={100} height={100} className="object-contain" />
                            <p className="text-2xl font-bold">{operands[1]}</p>
                        </div>
                    </div>
                     <Input 
                        type="number" 
                        value={userCount} 
                        onChange={(e) => setUserCount(e.target.value)}
                        className="h-16 w-48 text-center text-3xl font-bold"
                        placeholder="?"
                        disabled={!!feedback}
                    />
                </CardContent>
            </Card>
        )
    }
    
    return (
        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
            <Progress value={((currentProblemIndex + 1) / NUM_PROBLEMS) * 100} className="w-full" />
             {operation === 'count' ? renderLevelA() : (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-center font-body text-2xl sm:text-3xl">
                            Pose et calcule : <span className="font-numbers font-bold text-primary">{statement}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-6">
                        <div className="flex justify-center items-center scale-90 sm:scale-100 transform">
                            {operation === 'addition' ? (
                                <AdditionWidget
                                    initialState={{ id: 1, pos: {x:0, y:0}, size: {width: 450, height: 300}, numOperands: operands.length, numCols: String(Math.max(...operands)).length }}
                                    onUpdate={()=>{}}
                                    onClose={()=>{}}
                                    isExerciseMode={true}
                                    exerciseInputs={userInputs}
                                    onInputChange={handleInputChange}
                                    feedback={feedback}
                                />
                            ) : (
                                <SoustractionWidget
                                    initialState={{ id: 1, pos: {x:0, y:0}, size: {width: 450, height: 300}, numCols: String(operands[0]).length }}
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
            )}
            
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
