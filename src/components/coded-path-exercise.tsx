
'use client';

import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import type { SkillLevel } from '@/lib/skills';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';


type Move = 'up' | 'down' | 'left' | 'right';
type Tile = 'empty' | 'wall' | 'player' | 'key' | 'trap';
type Position = { x: number, y: number };
type LevelData = {
    grid: Tile[][];
    playerStart: Position;
    keyPos: Position;
};

const LEVEL_COUNT = 5;

// --- Grid Generation ---

// Helper to shuffle an array
const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Generates a maze-like structure for Level C
const generateMaze = (width: number, height: number): { grid: Tile[][], playerStart: Position, keyPos: Position } => {
    // Ensure width and height are odd for the maze algorithm
    const w = width % 2 === 0 ? width + 1 : width;
    const h = height % 2 === 0 ? height + 1 : height;
    
    let grid: Tile[][] = Array.from({ length: h }, () => Array(w).fill('wall'));
    let path: Position[] = [];

    function carvePassages(cx: number, cy: number) {
        const directions = shuffle([
            { x: 0, y: -2, wallY: -1 }, // North
            { x: 2, y: 0, wallX: 1 },  // East
            { x: 0, y: 2, wallY: 1 },  // South
            { x: -2, y: 0, wallX: -1 }  // West
        ]);

        for (const dir of directions) {
            const nx = cx + dir.x;
            const ny = cy + dir.y;

            if (ny >= 0 && ny < h && nx >= 0 && nx < w && grid[ny][nx] === 'wall') {
                grid[cy + (dir.wallY || 0)][cx + (dir.wallX || 0)] = 'empty';
                grid[ny][nx] = 'empty';
                path.push({x: nx, y: ny});
                carvePassages(nx, ny);
            }
        }
    }

    const startX = Math.floor(Math.random() * (w / 2)) * 2;
    const startY = Math.floor(Math.random() * (h / 2)) * 2;
    grid[startY][startX] = 'empty';
    path.push({x: startX, y: startY});
    carvePassages(startX, startY);

    const playerStart = path[0];
    const keyPos = path[path.length - 1];
    
    // Add traps after maze is carved
    const pathWithoutStartEnd = path.slice(1, -1);
    const trapCount = Math.floor(pathWithoutStartEnd.length * 0.1); // ~10% of path are traps
    for (let i = 0; i < trapCount; i++) {
        const trapIndex = Math.floor(Math.random() * pathWithoutStartEnd.length);
        const {x, y} = pathWithoutStartEnd[trapIndex];
        if (grid[y][x] === 'empty') {
            grid[y][x] = 'trap';
        }
    }

    return { grid, playerStart, keyPos };
};


const generateLevel = (level: SkillLevel): LevelData => {
    if (level === 'C') {
        const { grid, playerStart, keyPos } = generateMaze(15, 15);
        return { grid, playerStart, keyPos };
    }
    
    const width = 7;
    const height = 7;
    const grid: Tile[][] = Array.from({ length: height }, () => Array(width).fill('empty'));

    const wallCount = level === 'B' 
        ? Math.floor(Math.random() * 6) + 6 // 6 to 11 walls for level B
        : Math.floor(Math.random() * 5) + 4; // 4 to 8 walls for level A
        
    for (let i = 0; i < wallCount; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (grid[y][x] === 'empty') {
            grid[y][x] = 'wall';
        }
    }

    let playerStart: Position, keyPos: Position;

    if (level === 'B') {
        const corners = [
            { x: 0, y: 0 }, { x: width - 1, y: 0 },
            { x: 0, y: height - 1 }, { x: width - 1, y: height - 1 }
        ];
        
        let startCornerIndex, endCornerIndex;
        let attempts = 0;
        
        do {
            startCornerIndex = Math.floor(Math.random() * corners.length);
            playerStart = corners[startCornerIndex];
            attempts++;
            if (attempts > 10) return generateLevel('A'); // fallback
        } while (grid[playerStart.y][playerStart.x] !== 'empty');

        attempts = 0;
        do {
            endCornerIndex = Math.floor(Math.random() * corners.length);
            keyPos = corners[endCornerIndex];
            attempts++;
             if (attempts > 10) return generateLevel('A'); // fallback
        } while (endCornerIndex === startCornerIndex || grid[keyPos.y][keyPos.x] !== 'empty');
    } else { // Level A
        do {
            playerStart = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
        } while (grid[playerStart.y][playerStart.x] !== 'empty');
        
        do {
            keyPos = { x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) };
        } while (grid[keyPos.y][keyPos.x] !== 'empty' || (keyPos.x === playerStart.x && keyPos.y === playerStart.y));
    }

    if (!isPathPossible(grid, playerStart, keyPos)) {
        return generateLevel(level);
    }
    
    grid[playerStart.y][playerStart.x] = 'empty'; // Temporarily empty to place key
    grid[keyPos.y][keyPos.x] = 'empty';
    
    return { grid, playerStart, keyPos };
};


const isPathPossible = (grid: Tile[][], start: Position, end: Position): boolean => {
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

    const [level, setLevel] = useState<SkillLevel | null>(null);
    const [currentLevelData, setCurrentLevelData] = useState<LevelData | null>(null);

    const [path, setPath] = useState<Move[]>([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedPlayerPos, setSimulatedPlayerPos] = useState<Position | null>(null);
    const [realtimePlayerPos, setRealtimePlayerPos] = useState<Position | null>(null);
    const [brokenTraps, setBrokenTraps] = useState<Position[]>([]);


    useEffect(() => {
        if(student?.levels?.['coded-path']) {
            setLevel(student.levels['coded-path']);
        } else {
            setLevel('A');
        }
    }, [student]);
    
    useEffect(() => {
        if (level) {
            const newLevelData = generateLevel(level);
            setCurrentLevelData(newLevelData);
            setRealtimePlayerPos(newLevelData.playerStart);
            setBrokenTraps([]);
        }
    }, [currentLevelIndex, level]);

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
    
    const checkPathForLevelB_or_C = () => {
        if (!currentLevelData || path.length === 0) return;
        setIsSimulating(true);
        setBrokenTraps([]);

        let pos = { ...currentLevelData.playerStart };
        let pathIsCorrect = false;
        let step = 0;
        let trapsTriggered: Position[] = [];

        const interval = setInterval(() => {
            if (step >= path.length) { // End of path
                pathIsCorrect = pos.x === currentLevelData.keyPos.x && pos.y === currentLevelData.keyPos.y;
                clearInterval(interval);
                finalizeCheck(pathIsCorrect, path.join(', '));
                return;
            }

            const move = path[step];
            if (move === 'up') pos.y--;
            if (move === 'down') pos.y++;
            if (move === 'left') pos.x--;
            if (move === 'right') pos.x++;
            
            if (pos.y < 0 || pos.y >= currentLevelData.grid.length || pos.x < 0 || pos.x >= currentLevelData.grid[0].length || currentLevelData.grid[pos.y][pos.x] === 'wall' || trapsTriggered.some(t => t.x === pos.x && t.y === pos.y)) {
                pathIsCorrect = false;
                clearInterval(interval);
                finalizeCheck(false, path.join(', '));
                return;
            }

            if(currentLevelData.grid[pos.y][pos.x] === 'trap') {
                trapsTriggered.push({...pos});
                setBrokenTraps(prev => [...prev, {...pos}]);
                pathIsCorrect = false;
                clearInterval(interval);
                finalizeCheck(false, path.join(', '));
                return;
            }
            
            setSimulatedPlayerPos({ ...pos });
            step++;
        }, 200);
    };

    const handleRealtimeMove = (move: Move) => {
        if (!realtimePlayerPos || !currentLevelData || feedback) return;

        let nextPos = { ...realtimePlayerPos };
        if (move === 'up') nextPos.y--;
        if (move === 'down') nextPos.y++;
        if (move === 'left') nextPos.x--;
        if (move === 'right') nextPos.x++;

        const { y, x } = nextPos;
        if (y < 0 || y >= currentLevelData.grid.length || x < 0 || x >= currentLevelData.grid[0].length || currentLevelData.grid[y][x] === 'wall' || brokenTraps.some(t => t.x === x && t.y === y)) {
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 500);
            return;
        }
        
        if (currentLevelData.grid[y][x] === 'trap') {
            setBrokenTraps(prev => [...prev, { x, y }]);
            setFeedback('incorrect');
            setTimeout(() => setFeedback(null), 500);
            return;
        }


        setRealtimePlayerPos(nextPos);
        
        if (nextPos.x === currentLevelData.keyPos.x && nextPos.y === currentLevelData.keyPos.y) {
            finalizeCheck(true, `Mouvement direct ${move}`);
        }
    };


    const finalizeCheck = (isCorrect: boolean, userAnswer: string) => {
         const detail: ScoreDetail = {
            question: `Parcours ${currentLevelIndex + 1}`,
            userAnswer: userAnswer,
            correctAnswer: 'Chemin valide',
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
        if (level === 'A') {
            handleRealtimeMove(move);
        } else {
            if (isSimulating || feedback) return;
            setPath(prev => [...prev, move]);
        }
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
             if (isFinished && student && !hasBeenSaved && level) {
                setHasBeenSaved(true);
                const score = (correctAnswers / LEVEL_COUNT) * 100;
                if (isHomework && homeworkDate) {
                    await saveHomeworkResult({ userId: student.id, date: homeworkDate, skillSlug: 'coded-path', score });
                } else {
                    await addScore({ userId: student.id, skill: 'coded-path', score, details: sessionDetails, numberLevelSettings: { level } });
                }
            }
        };
        saveResult();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, isHomework, homeworkDate, level]);

    const restartExercise = () => {
        setCurrentLevelIndex(0);
        setIsFinished(false);
        setCorrectAnswers(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
    };
    
    if (!level) {
        return (
            <Card className="w-full max-w-lg mx-auto shadow-2xl p-6">
                <CardHeader>
                    <CardTitle>Choisis ton niveau</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Label>Niveau de difficulté</Label>
                    <Select onValueChange={(val) => setLevel(val as SkillLevel)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir un niveau..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A">Niveau A (Déplacement direct)</SelectItem>
                            <SelectItem value="B">Niveau B (Programmation simple)</SelectItem>
                            <SelectItem value="C">Niveau C (Labyrinthe & Pièges)</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        );
    }
    
    if (!currentLevelData) {
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
    
    const playerPos = level === 'A' ? realtimePlayerPos : (simulatedPlayerPos || currentLevelData.playerStart);
    if (!playerPos) return null; // Should not happen
    
    const isSmallGrid = level !== 'C';
    const tileSize = isSmallGrid ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-8 h-8';
    const iconSize = isSmallGrid ? 'h-8 w-8 sm:h-10 sm:h-10' : 'h-6 w-6';
    const textSize = isSmallGrid ? 'text-3xl sm:text-4xl' : 'text-xl';

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-2xl">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3}} />
            </div>
            <CardHeader>
                <CardTitle className="text-center font-headline text-3xl">Parcours Codé</CardTitle>
                <CardDescription className="text-center">Guidez le robot jusqu'à la clé.</CardDescription>
                <Progress value={((currentLevelIndex + 1) / LEVEL_COUNT) * 100} className="w-full mt-4 h-3" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="flex justify-center">
                     <div className={cn("grid border-2 bg-muted/20", feedback === 'incorrect' && level === 'A' && 'animate-shake')} style={{gridTemplateColumns: `repeat(${currentLevelData.grid[0].length}, 1fr)`}}>
                        {currentLevelData.grid.map((row, y) => 
                            row.map((tile, x) => {
                                const isPlayerHere = playerPos.x === x && playerPos.y === y;
                                const isStart = currentLevelData.playerStart.x === x && currentLevelData.playerStart.y === y;
                                const isKey = currentLevelData.keyPos.x === x && currentLevelData.keyPos.y === y;
                                const isBroken = brokenTraps.some(t => t.x === x && t.y === y);
                                return (
                                    <div key={`${y}-${x}`} className={cn("relative flex items-center justify-center border", textSize, tileSize,
                                      isStart && 'bg-blue-200/50',
                                      isKey && 'bg-yellow-200/50'
                                    )}>
                                        {isPlayerHere && <Bot className={cn(iconSize, "text-blue-600 z-10")}/>}
                                        {tile === 'wall' && <div className="w-full h-full bg-slate-600"/>}
                                        {isBroken && <div className="w-full h-full bg-black"/>}
                                        {tile === 'trap' && !isBroken && <div className="w-2/3 h-2/3 bg-slate-400/50 rounded-full border-2 border-dashed border-slate-500" />}
                                        {isKey && !isPlayerHere && <KeyRound className={cn(iconSize, "text-yellow-500")}/>}
                                    </div>
                                )
                           })
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {level !== 'A' && (
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
                    )}
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div></div>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('up')}><ArrowUp className="h-8 w-8"/></Button>
                        <div></div>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('left')}><ArrowLeft className="h-8 w-8"/></Button>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('down')}><ArrowDown className="h-8 w-8"/></Button>
                        <Button variant="outline" size="lg" className="h-16" onClick={() => addMove('right')}><ArrowRight className="h-8 w-8"/></Button>
                    </div>

                     {level !== 'A' && (
                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full" onClick={removeLastMove}><Undo2 className="mr-2 h-4 w-4"/>Annuler</Button>
                            <Button variant="destructive" className="w-full" onClick={clearPath}><Trash2 className="mr-2 h-4 w-4"/>Effacer</Button>
                        </div>
                     )}
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6">
                {level !== 'A' && (
                     <Button size="lg" className="w-full max-w-md" onClick={checkPathForLevelB_or_C} disabled={isSimulating || feedback !== null}>
                        <Play className="mr-2"/> Lancer le robot !
                    </Button>
                )}
                 {feedback === 'correct' && <div className="text-xl font-bold text-green-600 flex items-center gap-2 animate-pulse"><ThumbsUp/> Super !</div>}
                 {feedback === 'incorrect' && level !== 'A' && <div className="text-xl font-bold text-red-600 flex items-center gap-2 animate-shake"><X/> Oups, ce n'est pas le bon chemin.</div>}
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
