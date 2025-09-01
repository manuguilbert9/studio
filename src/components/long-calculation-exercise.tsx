
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Eye } from 'lucide-react';
import { AdditionWidget } from '@/components/tableau/addition-widget';
import { SoustractionWidget } from '@/components/tableau/soustraction-widget';

type OperationType = 'addition' | 'subtraction';

// A simple component to display the result of the calculation
function CalculationAnswer({ operand1, operand2, operation }: { operand1: number, operand2: number, operation: OperationType }) {
    const result = operation === 'addition' ? operand1 + operand2 : operand1 - operand2;
    return (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
            <p className="text-sm text-green-800">La bonne réponse est :</p>
            <p className="text-3xl font-bold text-green-600 font-numbers">{result}</p>
        </div>
    );
}


export function LongCalculationExercise() {
    const [numCols] = useState(3); // Default to 3-digit numbers
    const [showAnswer, setShowAnswer] = useState(false);
    
    // Generate a new problem by changing the key
    const [problemKey, setProblemKey] = useState(Date.now());

    const { operand1, operand2, operation } = useMemo(() => {
        const max = 10 ** numCols -1;
        const min = 10 ** (numCols - 1);
        const op1 = Math.floor(Math.random() * (max - min + 1)) + min;
        const op2 = Math.floor(Math.random() * (max - min + 1)) + min;

        const selectedOperation: OperationType = Math.random() < 0.5 ? 'addition' : 'subtraction';

        if (selectedOperation === 'subtraction' && op1 < op2) {
            return { operand1: op2, operand2: op1, operation: selectedOperation }; // Ensure op1 > op2 for subtraction
        }
        return { operand1: op1, operand2: op2, operation: selectedOperation };

    }, [problemKey, numCols]);

    const newCalculation = () => {
        setShowAnswer(false);
        setProblemKey(Date.now());
    };

    const emptyFunc = () => {};

    // Generate string versions of operands for the widgets
    const operand1Str = operand1.toString();
    const operand2Str = operand2.toString();


    return (
        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center scale-125 transform">
                        {operation === 'addition' ? (
                             <AdditionWidget
                                initialState={{ id: 1, pos: {x:0, y:0}, size: {width: 450, height: 300}, numOperands: 2, numCols, operand1: operand1Str, operand2: operand2Str }}
                                onUpdate={emptyFunc}
                                onClose={emptyFunc}
                                isExerciseMode={true}
                             />
                        ) : (
                             <SoustractionWidget
                                initialState={{ id: 1, pos: {x:0, y:0}, size: {width: 450, height: 300}, numCols, operand1: operand1Str, operand2: operand2Str }}
                                onUpdate={emptyFunc}
                                onClose={emptyFunc}
                                isExerciseMode={true}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {showAnswer && <CalculationAnswer operand1={operand1} operand2={operand2} operation={operation} />}

            <div className="flex gap-4 w-full">
                <Button onClick={() => setShowAnswer(true)} size="lg" variant="outline" className="w-full" disabled={showAnswer}>
                    <Eye className="mr-2"/>
                    Voir la réponse
                </Button>
                <Button onClick={newCalculation} size="lg" className="w-full">
                    <RefreshCw className="mr-2"/>
                    Nouveau calcul
                </Button>
            </div>
        </div>
    );
}
