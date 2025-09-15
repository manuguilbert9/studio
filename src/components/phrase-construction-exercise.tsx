
'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import type { SkillLevel } from '@/lib/skills';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import { Check, RefreshCw, X, Loader2, Sparkles, Wand2, ThumbsUp, Send } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { generatePhraseWords, validateConstructedPhrase, ValidatePhraseOutput } from '@/ai/flows/phrase-construction-flow';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';


export function PhraseConstructionExercise() {
  const { student } = useContext(UserContext);
  const searchParams = useSearchParams();
  const isHomework = searchParams.get('from') === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [level, setLevel] = useState<SkillLevel>('B');
  const [gameState, setGameState] = useState<'generating' | 'playing' | 'validating' | 'feedback'>('generating');
  
  const [wordsToUse, setWordsToUse] = useState<string[]>([]);
  const [userSentence, setUserSentence] = useState('');
  const [validationResult, setValidationResult] = useState<ValidatePhraseOutput | null>(null);
  
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  const [showConfetti, setShowConfetti] = useState(false);

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
      setWordsToUse(result.words);
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
    setTotalAttempts(prev => prev + 1);

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
      };
      setSessionDetails(prev => [...prev, detail]);

      if (result.isCorrect) {
        setTotalCorrect(prev => prev + 1);
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
      generateNewExercise();
  };

  const handleSaveAndQuit = async () => {
      if (!student) return;
      
      const score = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
      if (isHomework && homeworkDate) {
        await saveHomeworkResult({
            userId: student.id,
            date: homeworkDate,
            skillSlug: 'phrase-construction',
            score,
        });
      } else {
        await addScore({
            userId: student.id,
            skill: 'phrase-construction',
            score,
            details: sessionDetails,
            numberLevelSettings: { level }
        });
      }
      // Ideally, navigate away after saving
      console.log("Score saved, should navigate away now.");
  };

  if (gameState === 'generating') {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl p-6">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center">Préparation de l'exercice...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">L'IA prépare des mots pour toi...</p>
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
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-muted rounded-lg">
          {wordsToUse.map(word => <Badge key={word} variant="secondary" className="text-xl px-4 py-2">{word}</Badge>)}
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
               <div className="space-y-1">
                 <p className="font-semibold">{validationResult.feedback}</p>
                 {!validationResult.isCorrect && validationResult.correctedSentence && (
                    <p className="text-sm text-muted-foreground">Exemple correct : <em className="font-medium">"{validationResult.correctedSentence}"</em></p>
                 )}
               </div>
             </CardContent>
           </Card>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
         <Button 
            onClick={handleNext} 
            disabled={gameState === 'validating' || gameState === 'generating'}
            variant="secondary"
         >
           <Wand2 className="mr-2 h-4 w-4" />
           Exercice Suivant
         </Button>
      </CardFooter>
    </Card>
  );
}
