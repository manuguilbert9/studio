
'use client';

import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Check, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';

const GAME_DURATION_S = 60;

export function ComplementDixExercise() {
    const { student } = useContext(UserContext);
    const searchParams = useSearchParams();
    const isHomework = searchParams.get('from') === 'devoirs';
    const homeworkDate = searchParams.get('date');

    const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
    const [currentNumber, setCurrentNumber] = useState(0);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);

    const timerRef = useRef<NodeJS.Timeout>();

    const generateNewNumber = useCallback(() => {
        const num = Math.floor(Math.random() * 9) + 1; // 1 to 9
        setCurrentNumber(num);
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
            setGameState('finished');
        }
        return () => clearTimeout(timerRef.current);
    }, [gameState, timeLeft]);
    
    useEffect(() => {
        const saveResult = async () => {
             if (gameState === 'finished' && student && !hasBeenSaved) {
                setHasBeenSaved(true);
                // The score is simply the number of correct answers
                if (isHomework && homeworkDate) {
                    await saveHomeworkResult({
                        userId: student.id,
                        date: homeworkDate,
                        skillSlug: 'complement-dix',
                        score: score
                    });
                } else {
                    await addScore({
                        userId: student.id,
                        skill: 'complement-dix',
                        score: score,
                        details: sessionDetails,
                    });
                }
            }
        };
        saveResult();
    }, [gameState, student, score, hasBeenSaved, sessionDetails, isHomework, homeworkDate]);

    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (gameState !== 'playing' || feedback) return;

        const pressedKey = parseInt(event.key, 10);
        if (isNaN(pressedKey) || pressedKey < 0 || pressedKey > 9) return;

        const isCorrect = currentNumber + pressedKey === 10;
        
        const detail: ScoreDetail = {
            question: `10 - ${currentNumber}`,
            userAnswer: String(pressedKey),
            correctAnswer: String(10 - currentNumber),
            status: isCorrect ? 'correct' : 'incorrect',
        };
        setSessionDetails(prev => [...prev, detail]);
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }
        
        setTimeout(() => {
            setFeedback(null);
            generateNewNumber();
        }, 300);

    }, [gameState, currentNumber, feedback, generateNewNumber]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);

    const startGame = () => {
        setGameState('playing');
        setTimeLeft(GAME_DURATION_S);
        setScore(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
        generateNewNumber();
    };

    const renderContent = () => {
        switch (gameState) {
            case 'ready':
                return (
                    <div className="text-center">
                        <p className="text-lg text-muted-foreground mb-6">
                            Tu as une minute pour trouver le plus de compléments à 10 possible.
                            <br />
                            Utilise les touches de ton clavier pour répondre.
                        </p>
                        <Button onClick={startGame} size="lg">Démarrer !</Button>
                    </div>
                );
            case 'playing':
                return (
                    <div className="flex flex-col items-center gap-6">
                        <div className="text-6xl font-bold">Temps restant : {timeLeft}</div>
                        <div className="text-8xl font-bold p-8 rounded-lg bg-secondary">{currentNumber}</div>
                         <div className="h-10 text-2xl font-bold">
                            {feedback === 'correct' && <Check className="h-10 w-10 text-green-500"/>}
                            {feedback === 'incorrect' && <X className="h-10 w-10 text-red-500"/>}
                        </div>
                    </div>
                );
            case 'finished':
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">Temps écoulé !</h2>
                        <p className="text-5xl mb-6">
                            Ton score : <span className="font-bold text-primary">{score}</span>
                        </p>
                        <Button onClick={startGame} size="lg" variant="outline">
                            <RefreshCw className="mr-2" />
                            Rejouer
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <CardHeader>
                <CardTitle className="text-center text-3xl font-headline">Course aux compléments à 10</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[300px] flex justify-center items-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
