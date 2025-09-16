
'use client';

import { useState, useMemo, useEffect, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, RefreshCw, X, Loader2, ThumbsUp, GripVertical } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { Progress } from '@/components/ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { ScoreTube } from './score-tube';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateSentence } from '@/ai/flows/sentence-generation-flow';

const NUM_QUESTIONS = 5;

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length,  randomIndex;
  const newArray = [...array]; // Create a copy to avoid mutating the original
  
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [newArray[currentIndex], newArray[randomIndex]] = [
      newArray[randomIndex], newArray[currentIndex]];
  }

  return newArray;
};


interface LabelItem {
    id: string;
    word: string;
}

// The component for each draggable word label
function SortableLabel({ item }: { item: LabelItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="flex items-center gap-2 p-3 bg-card border rounded-lg shadow-sm cursor-grab active:cursor-grabbing active:shadow-md"
    >
      <GripVertical className="h-5 w-5 text-muted-foreground" />
      <span className="text-xl font-medium select-none">{item.word}</span>
    </div>
  );
}


export function LabelGameExercise() {
    const { student } = useContext(UserContext);
    const searchParams = useSearchParams();
    const isHomework = searchParams.get('from') === 'devoirs';
    const homeworkDate = searchParams.get('date');
    
    const [isLoading, setIsLoading] = useState(true);
    const [currentSentence, setCurrentSentence] = useState('');
    const [orderedLabels, setOrderedLabels] = useState<LabelItem[]>([]);

    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hasBeenSaved, setHasBeenSaved] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const sensors = useSensors(useSensor(PointerSensor));

    const setupQuestion = (sentence: string) => {
        const words = sentence.split(/\s+/).filter(Boolean);
        const shuffledLabels = shuffleArray(words.map((word, i) => ({ id: `${currentQuestionIndex}-${i}-${word}`, word })));
        setCurrentSentence(sentence);
        setOrderedLabels(shuffledLabels);
        setIsLoading(false);
    }
    
    const fetchNewSentence = async () => {
        setIsLoading(true);
        try {
            const { sentence } = await generateSentence();
            setupQuestion(sentence);
        } catch(e) {
            console.error("Failed to generate sentence:", e);
            // Fallback to a simple sentence on error
            setupQuestion("Le chat dort sur le tapis.");
        }
    }

    // Setup exercise on mount and for each new question
    useEffect(() => {
        fetchNewSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestionIndex]);

    const handleNextQuestion = () => {
        setShowConfetti(false);
        if (currentQuestionIndex < NUM_QUESTIONS - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setFeedback(null);
        } else {
            setIsFinished(true);
        }
    };
    
    const checkAnswer = () => {
        if (feedback) return;

        const reconstructedSentence = orderedLabels.map(label => label.word).join(' ');
        const isCorrect = reconstructedSentence === currentSentence;

        const detail: ScoreDetail = {
            question: `Remettre en ordre : "${currentSentence}"`,
            userAnswer: reconstructedSentence,
            correctAnswer: currentSentence,
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

        setTimeout(handleNextQuestion, 2000);
    };

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOrderedLabels((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    useEffect(() => {
        const saveResult = async () => {
             if (isFinished && student && !hasBeenSaved) {
                setHasBeenSaved(true);
                const score = (correctAnswers / NUM_QUESTIONS) * 100;
                if (isHomework && homeworkDate) {
                    await saveHomeworkResult({
                        userId: student.id,
                        date: homeworkDate,
                        skillSlug: 'label-game',
                        score: score
                    });
                } else {
                    await addScore({
                        userId: student.id,
                        skill: 'label-game',
                        score: score,
                        details: sessionDetails,
                        numberLevelSettings: { level: 'B' }
                    });
                }
            }
        };
        saveResult();
    }, [isFinished, student, correctAnswers, hasBeenSaved, sessionDetails, isHomework, homeworkDate]);

    const restartExercise = () => {
        setCurrentQuestionIndex(0);
        setFeedback(null);
        setIsFinished(false);
        setCorrectAnswers(0);
        setHasBeenSaved(false);
        setSessionDetails([]);
    };

    if (isLoading) {
        return (
            <Card className="w-full max-w-2xl mx-auto shadow-2xl p-6">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">Préparation de l'exercice...</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Je te pêche une nouvelle phrase... 🎣</p>
                </CardContent>
            </Card>
        );
    }
    
    if (isFinished) {
        const score = (correctAnswers / NUM_QUESTIONS) * 100;
        return (
            <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
                <CardHeader><CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-2xl">
                        Tu as reconstruit <span className="font-bold text-primary">{correctAnswers}</span> phrases sur <span className="font-bold">{NUM_QUESTIONS}</span>.
                    </p>
                    <ScoreTube score={score} />
                    <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4"><RefreshCw className="mr-2" />Recommencer</Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100}} />
            </div>
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-center">Le jeu des étiquettes</CardTitle>
                <CardDescription className="text-center">Fais glisser les mots pour remettre la phrase dans le bon ordre.</CardDescription>
                 <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mt-4 h-3" />
            </CardHeader>
            <CardContent className="min-h-[300px] flex flex-col items-center justify-center gap-6 p-6">
                
                <div className="p-4 bg-muted rounded-lg w-full min-h-[8rem] flex items-center justify-center">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={orderedLabels.map(l => l.id)} strategy={horizontalListSortingStrategy}>
                            <div className="flex flex-wrap justify-center gap-3">
                                {orderedLabels.map((labelItem) => (
                                    <SortableLabel key={labelItem.id} item={labelItem} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </CardContent>
             <CardFooter className="flex-col gap-4 pt-6">
                <Button size="lg" onClick={checkAnswer} disabled={!!feedback}>
                    <Check className="mr-2"/> Valider
                </Button>
                {feedback === 'correct' && <div className="text-xl font-bold text-green-600 flex items-center gap-2 animate-pulse"><ThumbsUp/> Parfait !</div>}
                {feedback === 'incorrect' && <div className="text-xl font-bold text-red-600 flex items-center gap-2 animate-shake"><X/> Oups, ce n'est pas le bon ordre. La bonne phrase était : "{currentSentence}"</div>}
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
