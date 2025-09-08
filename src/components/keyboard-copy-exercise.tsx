
'use client';

import { useState, useEffect, useMemo, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { RefreshCw, Keyboard } from 'lucide-react';
import { getSimpleWords } from '@/lib/word-list';
import { cn } from '@/lib/utils';
import Confetti from 'react-dom-confetti';
import { Progress } from './ui/progress';
import { ScoreTube } from './score-tube';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { VirtualKeyboard } from './virtual-keyboard';

const WORDS_PER_EXERCISE = 10;

export function KeyboardCopyExercise() {
    const { student } = useContext(UserContext);
    const [words, setWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [typedWord, setTypedWord] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);


    useEffect(() => {
        setWords(getSimpleWords(WORDS_PER_EXERCISE));
    }, []);

    const currentWord = useMemo(() => words[currentWordIndex] || '', [words, currentWordIndex]);
    
    const processInput = (input: string) => {
        const targetPart = currentWord.substring(0, input.length);
        if (input.toLowerCase() === targetPart.toLowerCase()) {
            setTypedWord(input);
        }
    }

    const handlePhysicalKeystroke = (e: KeyboardEvent) => {
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
             processInput(typedWord + e.key);
        } else if (e.key === 'Backspace') {
            processInput(typedWord.slice(0, -1));
        }
    }

     const handleVirtualKeystroke = (key: string) => {
        if (key === '⌫') { // Backspace
            processInput(typedWord.slice(0, -1));
        } else {
            processInput(typedWord + key);
        }
    };


    useEffect(() => {
        document.addEventListener('keydown', handlePhysicalKeystroke);
        return () => {
            document.removeEventListener('keydown', handlePhysicalKeystroke);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typedWord, currentWord]);


    useEffect(() => {
        if (typedWord.toLowerCase() === currentWord.toLowerCase() && currentWord !== '') {
            setCorrectAnswers(prev => prev + 1);
            setShowConfetti(true);
            const detail: ScoreDetail = {
                question: `Recopier "${currentWord}"`,
                userAnswer: typedWord,
                correctAnswer: currentWord,
                status: 'correct',
            };
            setSessionDetails(prev => [...prev, detail]);

            setTimeout(() => {
                setShowConfetti(false);
                if (currentWordIndex < WORDS_PER_EXERCISE - 1) {
                    setCurrentWordIndex(prev => prev + 1);
                    setTypedWord('');
                } else {
                    setIsFinished(true);
                }
            }, 1000);
        }
    }, [typedWord, currentWord, currentWordIndex]);
    
      useEffect(() => {
        const saveResult = async () => {
            if (isFinished && student && !hasBeenSaved) {
                setHasBeenSaved(true);
                const score = (correctAnswers / WORDS_PER_EXERCISE) * 100;
                await addScore({
                    userId: student.id,
                    skill: 'keyboard-copy',
                    score: score,
                    details: sessionDetails,
                });
            }
        };
        saveResult();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processInput(e.target.value);
    };

    const restartExercise = () => {
        setWords(getSimpleWords(WORDS_PER_EXERCISE));
        setCurrentWordIndex(0);
        setTypedWord('');
        setIsFinished(false);
        setCorrectAnswers(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
    };

    if (isFinished) {
        const score = (correctAnswers / WORDS_PER_EXERCISE) * 100;
        return (
            <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
                <CardHeader>
                    <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-2xl">
                        Bravo ! Tu as recopié <span className="font-bold text-primary">{correctAnswers}</span> mots sur <span className="font-bold">{WORDS_PER_EXERCISE}</span>.
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
            <Progress value={((currentWordIndex) / WORDS_PER_EXERCISE) * 100} className="w-full h-3" />
            <Card className="shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
                </div>
                 <CardHeader>
                    <CardTitle className="font-headline text-3xl">Recopie le mot suivant</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[250px] flex flex-col items-center justify-center gap-8 p-6">
                    <div className="font-mono text-7xl sm:text-8xl font-bold tracking-widest uppercase p-4 bg-muted rounded-lg">
                        {currentWord}
                    </div>
                    <div className="relative font-mono text-5xl sm:text-6xl font-bold tracking-wider uppercase">
                        {currentWord.split('').map((char, index) => (
                            <span key={index} className="relative inline-block mx-1">
                                <span className="opacity-20">{char}</span>
                                {index < typedWord.length && (
                                    <span className={cn(
                                        "absolute left-0",
                                        typedWord[index].toLowerCase() === char.toLowerCase() ? 'text-green-500' : 'text-red-500'
                                    )}>
                                        {typedWord[index].toUpperCase()}
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                     <input
                        type="text"
                        value={typedWord}
                        onChange={handleInputChange}
                        className="absolute -top-full"
                        autoFocus
                        onBlur={(e) => e.target.focus()}
                    />
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => setShowVirtualKeyboard(p => !p)}>
                        <Keyboard className="mr-2" />
                        {showVirtualKeyboard ? 'Cacher' : 'Afficher'} le clavier
                    </Button>
                </CardFooter>
            </Card>

            {showVirtualKeyboard && <VirtualKeyboard onKeyPress={handleVirtualKeystroke} />}
        </div>
    )
}
