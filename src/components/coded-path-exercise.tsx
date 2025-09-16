
'use client';

import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Bot, KeyRound, RefreshCw, Play, Trash2, Undo2, ThumbsUp, X, Loader2 } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { Progress } from './ui/progress';
import { ScoreTube } from './score-tube';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';

type Move = 'up' | 'down' | 'left' | 'right';
type Tile = 'empty' | 'wall' | 'player' | 'key';
type Level = {
    grid: Tile[][];
    playerStart: { x: number, y: number };
    keyPos: { x: number, y: number };
};

const LEVEL_COUNT = 5;

// --- Grid Generation ---
const generateLevel = (): Level => {
    const width = 7;
    const height = 7;
    const grid: Tile[][] = Array.from({ length: height }, () => Array(width).fill('empty'));

    // Place walls
    const wallCount = Math.floor(Math.random() * 5) + 4; // 4 to 8 walls
    for (let i = 0; i < wallCount; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (grid[y][x] === 'empty') {
            grid[y][x] = 'wall';
        }
    }

    // Place player and key, ensuring they are not on walls and are reachable
    let playerStart, keyPos;
    do {
        playerStart = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
    } while (grid[playerStart.y][playerStart.x] !== 'empty');
    grid[playerStart.y][playerStart.x] = 'player';
    
    do {
        keyPos = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
    } while (grid[keyPos.y][keyPos.x] !== 'empty' || (keyPos.x === playerStart.x && keyPos.y === playerStart.y));
    grid[keyPos.y][keyPos.x] = 'key';
    
    // Check if path exists, regenerate if not. This is a simple check.
    if (!isPathPossible(grid, playerStart, keyPos)) {
        return generateLevel();
    }

    return { grid, playerStart, keyPos };
};

// Simple BFS to check if a path exists
const isPathPossible = (grid: Tile[][], start: {x:number, y:number}, end: {x:number, y:number}): boolean => {
    const queue = [start];
    const visited = new Set([`${start.y},${start.x}`]);
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const width = grid[0].length;
    const height = grid.length;

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.x === end.x && current.y === end.y) return true;

        for (const [dx, dy] of dirs) {
            const nextX = current.x + dx;
            const nextY = current.y + dy;
            if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height && grid[nextY][nextX] !== 'wall' && !visited.has(`${nextY},${nextX}`)) {
                visited.add(`${nextY},${nextX}`);
                queue.push({ x: nextX, y: nextY });
            }
        }
    }
    return false;
};

export function CodedPathExercise() {
    const { student } = useContext(UserContext);
    const searchParams = useSearchParams();
    const isHomework = searchParams.get('from') === 'devoirs';
    const homeworkDate = searchParams.get('date');

    const [level, setLevel] = useState<Level | null>(null);
    const [path, setPath] = useState<Move[]>([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedPlayerPos, setSimulatedPlayerPos] = useState<{x:number, y:number} | null>(null);
    
    useEffect(() => {
        setLevel(generateLevel());
    }, [currentLevelIndex]);

    const handleNextLevel = () => {
        setShowConfetti(false);
        if (currentLevelIndex < LEVEL_COUNT - 1) {
            setCurrentLevelIndex(prev => prev + 1);
            setPath([]);
            setFeedback(null);
        } else {
            setIsFinished(true);
        }
    };
    
    const checkPath = () => {
        if (!level || path.length === 0) return;
        setIsSimulating(true);

        let pos = { ...level.playerStart };
        let pathIsCorrect = false;
        let step = 0;

        const interval = setInterval(() => {
            if (step >= path.length) { // End of path
                pathIsCorrect = pos.x === level.keyPos.x && pos.y === level.keyPos.y;
                clearInterval(interval);
                finalizeCheck(pathIsCorrect);
                return;
            }

            const move = path[step];
            if (move === 'up') pos.y--;
            if (move === 'down') pos.y++;
            if (move === 'left') pos.x--;
            if (move === 'right') pos.x++;
            
            // Check for collision
            if (pos.y < 0 || pos.y >= level.grid.length || pos.x < 0 || pos.x >= level.grid[0].length || level.grid[pos.y][pos.x] === 'wall') {
                pathIsCorrect = false;
                clearInterval(interval);
                finalizeCheck(false);
                return;
            }
            
            setSimulatedPlayerPos({ ...pos });
            step++;
        }, 300);
    };

    const finalizeCheck = (isCorrect: boolean) => {
         const detail: ScoreDetail = {
            question: `Parcours ${currentLevelIndex + 1}`,
            userAnswer: path.join(', '),
            correctAnswer: 'Chemin valide', // Correct path can be complex, so we simplify
            status: isCorrect ? 'correct' : 'incorrect',
        };
        setSessionDetails(prev => [...prev, detail]);
        
        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
            setFeedback('correct');
            setShowConfetti(true);
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            setIsSimulating(false);
            setSimulatedPlayerPos(null);
            if (isCorrect) {
                handleNextLevel();
            } else {
                setFeedback(null);
            }
        }, 2000);
    }

    const addMove = (move: Move) => {
        if (isSimulating || feedback) return;
        setPath(prev => [...prev, move]);
    }
    const removeLastMove = () => {
        if (isSimulating || feedback) return;
        setPath(prev => prev.slice(0, -1));
    }
    const clearPath = () => {
        if (isSimulating || feedback) return;
        setPath([]);
    }

     useEffect(() => {
        const saveResult = async () => {
             if (isFinished && student && !hasBeenSaved) {
                setHasBeenSaved(true);
                const score = (correctAnswers / LEVEL_COUNT) * 100;
                if (isHomework && homeworkDate) {
                    await saveHomeworkResult({ userId: student.id, date: homeworkDate, skillSlug: 'coded-path', score });
                } else {
                    await addScore({ userId: student.id, skill: 'coded-path', score, details: sessionDetails });
                }
            }
        };
        saveResult();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, isHomework, homeworkDate]);

    const restartExercise = () => {
        setCurrentLevelIndex(0);
        setIsFinished(false);
        setCorrectAnswers(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
    };
    
    if (!level) {
        return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></Card>;
    }

    if (isFinished) {
        return (
            <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
                <CardHeader><CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-2xl">
                        Tu as réussi <span className="font-bold text-primary">{correctAnswers}</span> parcours sur <span className="font-bold">{LEVEL_COUNT}</span>.
                    </p>
                    <ScoreTube score={(correctAnswers / LEVEL_COUNT) * 100} />
                    <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4"><RefreshCw className="mr-2" />Recommencer</Button>
                </CardContent>
            </Card>
        );
    }
    
    const playerPos = simulatedPlayerPos || level.playerStart;

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-2xl">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3}} />
            </div>
            <CardHeader>
                <CardTitle className="text-center font-headline text-3xl">Parcours Codé</CardTitle>
                <CardDescription className="text-center">Construis le chemin pour que le robot atteigne la clé.</CardDescription>
                <Progress value={((currentLevelIndex + 1) / LEVEL_COUNT) * 100} className="w-full mt-4 h-3" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex justify-center">
                     <div className="grid border-2 bg-muted/20" style={{gridTemplateColumns: `repeat(${level.grid[0].length}, 1fr)`}}>
                        {level.grid.flat().map((tile, index) => {
                            const x = index % level.grid[0].length;
                            const y = Math.floor(index / level.grid[0].length);
                            const isPlayerHere = playerPos.x === x && playerPos.y === y;
                            return (
                                <div key={index} className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border text-3xl sm:text-4xl">
                                    {isPlayerHere && <Bot className="h-8 w-8 sm:h-10 sm:h-10 text-blue-600 z-10"/>}
                                    {tile === 'wall' && <div className="w-full h-full bg-slate-600"/>}
                                    {tile === 'key' && !isPlayerHere && <KeyRound className="h-8 w-8 text-yellow-500"/>}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted min-h-[6rem]">
                         <p className="text-sm text-muted-foreground mb-2">Chemin programmé :</p>
                         <div className="flex flex-wrap gap-1">
                            {path.map((move, i) => {
                                if (move === 'up') return <ArrowUp key={i} className="h-8 w-8 text-secondary-foreground"/>
                                if (move === 'down') return <ArrowDown key={i} className="h-8 w-8 text-secondary-foreground"/>
                                if (move === 'left') return <ArrowLeft key={i} className="h-8 w-8 text-secondary-foreground"/>
                                if (move === 'right') return <ArrowRight key={i} className="h-8 w-8 text-secondary-foreground"/>
                                return null;
                            })}
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div></div>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('up')}><ArrowUp className="h-8 w-8"/></Button>
                        <div></div>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('left')}><ArrowLeft className="h-8 w-8"/></Button>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('down')}><ArrowDown className="h-8 w-8"/></Button>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('right')}><ArrowRight className="h-8 w-8"/></Button>
                    </div>

                     <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={removeLastMove}><Undo2 className="mr-2 h-4 w-4"/>Annuler</Button>
                        <Button variant="destructive" className="w-full" onClick={clearPath}><Trash2 className="mr-2 h-4 w-4"/>Effacer</Button>
                    </div>

                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
                <Button size="lg" className="w-full max-w-md" onClick={checkPath} disabled={isSimulating || feedback !== null}>
                    <Play className="mr-2"/> Lancer le robot !
                </Button>
                 {feedback === 'correct' && <div className="text-xl font-bold text-green-600 flex items-center gap-2 animate-pulse"><ThumbsUp/> Super !</div>}
                 {feedback === 'incorrect' && <div className="text-xl font-bold text-red-600 flex items-center gap-2 animate-shake"><X/> Oups, ce n'est pas le bon chemin.</div>}
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
    );
}
