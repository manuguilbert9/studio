
'use client';

import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import type { SkillLevel } from '@/lib/skills';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Check, RefreshCw, X, Loader2, Wand2, ThumbsUp, Send } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { generatePhraseWords, validateConstructedPhrase, type ValidatePhraseOutput } from '@/ai/flows/phrase-construction-flow';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Progress } from './ui/progress';
import { ScoreTube } from './score-tube';

const NUM_SENTENCES_PER_SESSION = 5;

// Helper function to shuffle an array
const shuffleArray = (array: any[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

export function PhraseConstructionExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [level, setLevel] = useState<SkillLevel>('B');
  const [gameState, setGameState] = useState<'generating' | 'playing' | 'validating' | 'feedback' | 'finished'>('generating');
  
  const [wordsToUse, setWordsToUse] = useState<string[]>([]);
  const [userSentence, setUserSentence] = useState('');
  const [validationResult, setValidationResult] = useState<ValidatePhraseOutput | null>(null);
  
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  useEffect(() => {
    if (student?.levels?.['phrase-construction']) {
      setLevel(student.levels['phrase-construction']);
    }
  }, [student]);

  const generateNewExercise = useCallback(async () => {
    setGameState('generating');
    setUserSentence('');
    setValidationResult(null);
    try {
      const result = await generatePhraseWords({ level });
      setWordsToUse(shuffleArray(result.words));
      setGameState('playing');
    } catch (error) {
      console.error("Failed to generate words:", error);
      // Handle error appropriately
    }
  }, [level]);

  useEffect(() => {
    generateNewExercise();
  }, [generateNewExercise]);
  
  const handleSubmit = async () => {
    if (!userSentence.trim() || gameState !== 'playing') return;

    setGameState('validating');

    try {
      const result = await validateConstructedPhrase({
        providedWords: wordsToUse,
        userSentence: userSentence,
        level: level,
      });
      setValidationResult(result);
      
      const detail: ScoreDetail = {
        question: `Mots: ${wordsToUse.join(', ')}`,
        userAnswer: userSentence,
        correctAnswer: result.isCorrect ? userSentence : (result.correctedSentence || 'N/A'),
        status: result.isCorrect ? 'correct' : 'incorrect',
        // Let's store the score in the detail object
        score: result.score,
      };
      setSessionDetails(prev => [...prev, detail]);

      if (result.isCorrect) {
        setShowConfetti(true);
      }
      
      setGameState('feedback');
    } catch (error) {
      console.error("Failed to validate sentence:", error);
      setGameState('playing'); // Revert state on error
    }
  };
  
  const handleNext = () => {
      setShowConfetti(false);
      if(currentSentenceIndex < NUM_SENTENCES_PER_SESSION - 1) {
          setCurrentSentenceIndex(prev => prev + 1);
          generateNewExercise();
      } else {
          setGameState('finished');
      }
  };

  const typedWords = useMemo(() => {
    // Normalize and split the user's sentence into a set of unique words for quick lookup.
    return new Set(
      userSentence
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[.,'!?]/g, '') // remove punctuation
        .split(/\s+/) // split by spaces
    );
  }, [userSentence]);

  useEffect(() => {
    const saveFinalScore = async () => {
        if (gameState === 'finished' && student && !hasBeenSaved) {
            setHasBeenSaved(true);
            const totalScore = sessionDetails.reduce((acc, detail) => {
                 // Use the score saved in the detail object
                 const score = detail.score || 0;
                 return acc + score;
            }, 0);
            const finalScore = sessionDetails.length > 0 ? totalScore / sessionDetails.length : 0;
            
            if (isHomework && homeworkDate) {
                await saveHomeworkResult({
                    userId: student.id,
                    date: homeworkDate,
                    skillSlug: 'phrase-construction',
                    score: finalScore,
                });
            } else {
                await addScore({
                    userId: student.id,
                    skill: 'phrase-construction',
                    score: finalScore,
                    details: sessionDetails,
                    numberLevelSettings: { level }
                });
            }
        }
    };
    saveFinalScore();
  }, [gameState, student, hasBeenSaved, sessionDetails, level, isHomework, homeworkDate]);

  const restartExercise = () => {
    setGameState('generating');
    setCurrentSentenceIndex(0);
    setSessionDetails([]);
    setHasBeenSaved(false);
    generateNewExercise();
  };

  if (gameState === 'generating') {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl p-6">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Préparation de l'exercice...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Préparation des mots...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (gameState === 'finished') {
    const totalScore = sessionDetails.reduce((acc, detail) => acc + (detail.score || 0), 0);
    const finalScore = sessionDetails.length > 0 ? totalScore / sessionDetails.length : 0;
    const correctCount = sessionDetails.filter(d => d.status === 'correct').length;
     return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-headline mb-4">Session terminée !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as réussi <span className="font-bold text-primary">{correctCount}</span> phrases sur <span className="font-bold">{NUM_SENTENCES_PER_SESSION}</span>.
          </p>
          <ScoreTube score={finalScore} />
          <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
            <RefreshCw className="mr-2" />
            Recommencer une nouvelle session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3}} />
      </div>

      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center">Construis une phrase correcte</CardTitle>
        <CardDescription className="text-center">Utilise tous les mots suivants pour former une phrase qui a du sens.</CardDescription>
        <Progress value={((currentSentenceIndex + 1) / NUM_SENTENCES_PER_SESSION) * 100} className="w-full mt-4 h-3" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-muted rounded-lg">
          {wordsToUse.map((word, index) => {
            const isUsed = typedWords.has(word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            return (
              <Badge 
                key={`${word}-${index}`} 
                variant={isUsed ? 'default' : 'secondary'} 
                className={cn(
                  "text-xl px-4 py-2 transition-colors duration-300",
                  isUsed && "bg-green-200 text-green-800"
                )}
              >
                {word}
              </Badge>
            );
          })}
        </div>
        
        <Textarea
          value={userSentence}
          onChange={(e) => setUserSentence(e.target.value)}
          placeholder="Écris ta phrase ici..."
          rows={4}
          className="text-xl"
          disabled={gameState !== 'playing'}
        />
        
        <div className="text-center">
            <Button 
                onClick={handleSubmit} 
                disabled={gameState !== 'playing' || !userSentence.trim()}
                size="lg"
            >
              {gameState === 'validating' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Valider ma phrase
            </Button>
        </div>
        
        {gameState === 'feedback' && validationResult && (
           <Card className={cn("p-4", validationResult.isCorrect ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400")}>
             <CardContent className="flex items-start gap-4 p-0">
               {validationResult.isCorrect ? <ThumbsUp className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" /> : <X className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />}
               <div className="space-y-1 flex-grow">
                 <div className="flex justify-between items-center">
                   <p className="font-semibold">{validationResult.feedback}</p>
                   <Badge variant={validationResult.isCorrect ? "default" : "destructive"}>{validationResult.score}/100</Badge>
                 </div>
                 {!validationResult.isCorrect && validationResult.correctedSentence && (
                    <p className="text-sm text-muted-foreground">Exemple correct : <em className="font-medium">"{validationResult.correctedSentence}"</em></p>
                 )}
               </div>
             </CardContent>
           </Card>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
         {gameState === 'feedback' && (
             <Button 
                onClick={handleNext} 
                variant="secondary"
            >
            <Wand2 className="mr-2 h-4 w-4" />
            {currentSentenceIndex < NUM_SENTENCES_PER_SESSION - 1 ? "Exercice Suivant" : "Terminer la session"}
            </Button>
         )}
      </CardFooter>
    </Card>
  );
}
