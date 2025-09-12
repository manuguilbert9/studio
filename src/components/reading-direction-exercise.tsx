
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, RefreshCw, Star } from 'lucide-react';
import Confetti from 'react-dom-confetti';

const GRID_SIZE = 5;
const TOTAL_ITEMS = GRID_SIZE * GRID_SIZE;

const vehicleEmojis = ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🚀', '🚁', '🚂', '🛸', '⛵️', '🚤'];
const fruitEmojis = ['🍎', '🍌', '🍇', '🍓', '🥝', '🍍', '🍑', '🍒', '🍈', '🍉', '🥭', '🥥', '🍅', '🍆', '🥑', '🌽', '🥕', '🥬', '🥦'];

const generateGrid = (): string[] => {
    const emojiSet = Math.random() > 0.5 ? vehicleEmojis : fruitEmojis;
    const grid: string[] = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
        grid.push(emojiSet[Math.floor(Math.random() * emojiSet.length)]);
    }
    return grid;
};

export function ReadingDirectionExercise() {
    const [grid, setGrid] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [errorIndex, setErrorIndex] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    
    useEffect(() => {
        setGrid(generateGrid());
    }, []);

    const handleClick = (index: number) => {
        if (index === currentIndex) {
            setCurrentIndex(prev => prev + 1);
            setErrorIndex(null);
            if (index === TOTAL_ITEMS - 1) {
                setIsFinished(true);
            }
        } else {
            setErrorIndex(index);
            setTimeout(() => setErrorIndex(null), 500);
        }
    };

    const restartExercise = () => {
        setGrid(generateGrid());
        setCurrentIndex(0);
        setErrorIndex(null);
        setIsFinished(false);
    };
    
    if (isFinished) {
        return (
            <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-8 relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Confetti active={true} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 3000, stagger: 3}} />
                </div>
                <Star className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
                <h1 className="font-headline text-4xl mb-4">Bravo !</h1>
                <p className="text-lg text-muted-foreground mb-6">Tu as terminé l'exercice.</p>
                <Button onClick={restartExercise} size="lg">
                    <RefreshCw className="mr-2" />
                    Recommencer
                </Button>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-xl mx-auto shadow-2xl">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">Suis la flèche !</CardTitle>
                <p className="text-muted-foreground">Appuie sur les objets de gauche à droite, en partant de la première ligne.</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div 
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                    }}
                >
                    {grid.map((emoji, index) => (
                        <div key={index} className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                            {currentIndex <= index && (
                                <button
                                    onClick={() => handleClick(index)}
                                    className={cn(
                                        "text-4xl sm:text-5xl w-full h-full rounded-lg transition-all duration-200 flex items-center justify-center bg-secondary/50 hover:bg-secondary",
                                        currentIndex === index && "ring-4 ring-primary ring-offset-2",
                                        errorIndex === index && "animate-shake bg-red-200"
                                    )}
                                >
                                    {emoji}
                                </button>
                            )}
                            {currentIndex === index && (
                                 <ArrowRight className="absolute -left-8 h-8 w-8 text-primary animate-pulse hidden sm:block" />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
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
    );
}
