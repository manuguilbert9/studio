
'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { RefreshCw, Keyboard, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Confetti from 'react-dom-confetti';
import { Progress } from './ui/progress';
import { ScoreTube } from './score-tube';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { VirtualKeyboard } from './virtual-keyboard';

const LETTERS_PER_EXERCISE = 20;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function LetterRecognitionExercise() {
    const { student } = useContext(UserContext);
    const [currentLetter, setCurrentLetter] = useState('');
    const [lettersDone, setLettersDone] = useState(0);
    
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);

    const pickNewLetter = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * ALPHABET.length);
        setCurrentLetter(ALPHABET[randomIndex]);
    }, []);

    useEffect(() => {
        pickNewLetter();
    }, [pickNewLetter]);

    const handleCorrect = () => {
        setCorrectAnswers(prev => prev + 1);
        setFeedback('correct');
        setShowConfetti(true);

        const detail: ScoreDetail = {
            question: `Appuyer sur la touche "${currentLetter}"`,
            userAnswer: currentLetter,
            correctAnswer: currentLetter,
            status: 'correct',
        };
        setSessionDetails(prev => [...prev, detail]);
        
        setTimeout(handleNextLetter, 1000);
    };

    const handleIncorrect = (pressedKey: string) => {
        setFeedback('incorrect');
        const detail: ScoreDetail = {
            question: `Appuyer sur la touche "${currentLetter}"`,
            userAnswer: pressedKey,
            correctAnswer: currentLetter,
            status: 'incorrect',
        };
        setSessionDetails(prev => [...prev, detail]);
        
        setTimeout(() => {
            setFeedback(null);
        }, 800);
    };
    
    const handleNextLetter = () => {
         if (lettersDone < LETTERS_PER_EXERCISE - 1) {
            setLettersDone(prev => prev + 1);
            setFeedback(null);
            setShowConfetti(false);
            pickNewLetter();
        } else {
            setIsFinished(true);
        }
    }

    const handleKeyPress = useCallback((key: string) => {
        if (feedback) return;

        if (key.toUpperCase() === currentLetter) {
            handleCorrect();
        } else {
            handleIncorrect(key.toUpperCase());
        }
    }, [currentLetter, feedback, handleCorrect, handleIncorrect]);

    useEffect(() => {
        const handlePhysicalKeystroke = (e: KeyboardEvent) => {
             // Ignore everything but single letters
            if (/^[a-zA-Z]$/.test(e.key)) {
                handleKeyPress(e.key);
            }
        };

        document.addEventListener('keydown', handlePhysicalKeystroke);
        return () => {
            document.removeEventListener('keydown', handlePhysicalKeystroke);
        };
    }, [handleKeyPress]);

    useEffect(() => {
        const saveResult = async () => {
            if (isFinished && student && !hasBeenSaved) {
                setHasBeenSaved(true);
                const score = (correctAnswers / LETTERS_PER_EXERCISE) * 100;
                await addScore({
                    userId: student.id,
                    skill: 'letter-recognition',
                    score: score,
                    details: sessionDetails,
                });
            }
        };
        saveResult();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails]);

    const restartExercise = () => {
        setCurrentLetter('');
        setLettersDone(0);
        setFeedback(null);
        setShowConfetti(false);
        setIsFinished(false);
        setCorrectAnswers(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
        pickNewLetter();
    };

    if (isFinished) {
        const score = (correctAnswers / LETTERS_PER_EXERCISE) * 100;
        return (
            <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-2xl">
                        Bravo ! Tu as reconnu <span className="font-bold text-primary">{correctAnswers}</span> lettres sur <span className="font-bold">{LETTERS_PER_EXERCISE}</span>.
                    </p>
                    <ScoreTube score={score} />
                    <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
                        <RefreshCw className="mr-2" />
                        Recommencer
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <Progress value={((lettersDone) / LETTERS_PER_EXERCISE) * 100} className="w-full h-3" />
            <Card className={cn(
                "shadow-2xl text-center relative overflow-hidden transition-colors duration-300",
                feedback === 'correct' && 'bg-green-100 border-green-500',
                feedback === 'incorrect' && 'bg-red-100 border-red-500 animate-shake'
            )}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
                </div>
                 <CardHeader>
                    <CardTitle className="font-headline text-3xl">Appuie sur la bonne touche</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[250px] flex flex-col items-center justify-center gap-8 p-6">
                     <div className="relative font-mono text-9xl sm:text-[12rem] font-bold tracking-widest uppercase p-4 rounded-lg">
                        {currentLetter}
                        {feedback === 'correct' && <Check className="absolute -right-4 -top-4 h-16 w-16 text-green-600" />}
                        {feedback === 'incorrect' && <X className="absolute -right-4 -top-4 h-16 w-16 text-red-600" />}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button variant="outline" onClick={() => setShowVirtualKeyboard(p => !p)}>
                        <Keyboard className="mr-2" />
                        {showVirtualKeyboard ? 'Cacher' : 'Afficher'} le clavier
                    </Button>
                </CardFooter>
            </Card>

            {showVirtualKeyboard && <VirtualKeyboard onKeyPress={handleKeyPress} />}
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
