
'use client';

import type { Skill } from '@/lib/skills.tsx';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Heart, Sparkles, Star, ThumbsUp, X, RefreshCw } from 'lucide-react';
import { AnalogClock } from './analog-clock';
import { generateQuestions, type Question, type CalculationSettings as CalcSettings, type CurrencySettings as CurrSettings, currency as currencyData, formatCurrency } from '@/lib/questions';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { ScoreHistoryChart } from './score-history-chart';
import { Skeleton } from './ui/skeleton';
import { ScoreTube } from './score-tube';
import { CalculationSettings } from './calculation-settings';
import { CurrencySettings } from './currency-settings';


const motivationalMessages = [
  "Excellent travail !", "Tu es une star !", "Incroyable !", "Continue comme ça !", "Fantastique !", "Bien joué !"
];
const icons = [
  <Star key="star" className="h-8 w-8 text-yellow-400" />,
  <ThumbsUp key="thumbsup" className="h-8 w-8 text-blue-500" />,
  <Heart key="heart" className="h-8 w-8 text-red-500" />,
  <Sparkles key="sparkles" className="h-8 w-8 text-amber-500" />,
];

const NUM_QUESTIONS = 10;

export interface Score {
  userId: string;
  skill: string;
  score: number;
  createdAt: Timestamp;
  calculationSettings?: CalcSettings;
  currencySettings?: CurrSettings;
}

export function ExerciseWorkspace({ skill }: { skill: Skill }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [scoreHistory, setScoreHistory] = useState<Score[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [calculationSettings, setCalculationSettings] = useState<CalcSettings | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrSettings | null>(null);
  const [isReadyToStart, setIsReadyToStart] = useState(false);


  useEffect(() => {
    if (skill.slug !== 'calculation' && skill.slug !== 'currency') {
      setQuestions(generateQuestions(skill.slug, NUM_QUESTIONS));
      setIsReadyToStart(true);
    }
    const storedName = localStorage.getItem('skillfiesta_username');
    if (storedName) {
      setUsername(storedName);
    }
  }, [skill.slug]);
  
  const startCalculationExercise = (settings: CalcSettings) => {
    setCalculationSettings(settings);
    setQuestions(generateQuestions(skill.slug, NUM_QUESTIONS, { calculation: settings }));
    setIsReadyToStart(true);
  };
  
  const startCurrencyExercise = (settings: CurrSettings) => {
    setCurrencySettings(settings);
    setQuestions(generateQuestions(skill.slug, NUM_QUESTIONS, { currency: settings }));
    setIsReadyToStart(true);
  };

  const exerciseData = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [currentQuestionIndex, questions]);

  const handleNextQuestion = () => {
    setFeedback(null);
    setShowConfetti(false);
    if (currentQuestionIndex < NUM_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };
  
  const handleAnswer = (option: string) => {
    if (feedback || !exerciseData.answer) return;

    if (option === exerciseData.answer) {
      setCorrectAnswers(prev => prev + 1);
      setFeedback('correct');
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationalMessage(randomMessage);
      setShowConfetti(true);
      setTimeout(handleNextQuestion, 2500);
    } else {
      setFeedback('incorrect');
      setTimeout(handleNextQuestion, 1500);
    }
  };
  
  useEffect(() => {
    const saveScoreAndFetchHistory = async () => {
      if (isFinished && username && !isSaving) {
        setIsSaving(true);
        setIsLoadingHistory(true);
        
        const newScore = (correctAnswers / NUM_QUESTIONS) * 100;
        
        const scoreData: any = {
            userId: username,
            skill: skill.slug,
            score: newScore,
            createdAt: serverTimestamp()
        };

        if (skill.slug === 'calculation' && calculationSettings) {
            scoreData.calculationSettings = calculationSettings;
        }

        if (skill.slug === 'currency' && currencySettings) {
            scoreData.currencySettings = currencySettings;
        }

        try {
          await addDoc(collection(db, "scores"), scoreData);
        } catch (e) {
          console.error("Error adding document: ", e);
        }
        
        try {
          const scoresRef = collection(db, "scores");
          const q = query(
            scoresRef,
            where("userId", "==", username),
            where("skill", "==", skill.slug)
          );
          const querySnapshot = await getDocs(q);
          const history = querySnapshot.docs
            .map(doc => doc.data() as Score)
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
          setScoreHistory(history);
        } catch (e) {
          console.error("Error fetching scores: ", e);
        } finally {
            setIsLoadingHistory(false);
        }
      }
    };
    
    saveScoreAndFetchHistory();
  }, [isFinished, username, skill.slug, isSaving, correctAnswers, calculationSettings, currencySettings]);
  
  const restartExercise = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
    setScoreHistory([]);
    setIsLoadingHistory(true);
    setIsSaving(false);
    setIsReadyToStart(false);
    setCalculationSettings(null);
    setCurrencySettings(null);
     if (skill.slug !== 'calculation' && skill.slug !== 'currency') {
      setQuestions(generateQuestions(skill.slug, NUM_QUESTIONS));
      setIsReadyToStart(true);
    }
  };

  if (!isReadyToStart) {
      if (skill.slug === 'calculation') {
        return <CalculationSettings onStart={startCalculationExercise} />;
      }
      if (skill.slug === 'currency') {
        return <CurrencySettings onStart={startCurrencyExercise} />;
      }
  }

  if (isFinished) {
    const score = (correctAnswers / NUM_QUESTIONS) * 100;
    return (
      <Card className="w-full shadow-2xl text-center p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{NUM_QUESTIONS}</span>.
          </p>
          
          <ScoreTube score={score} />
         
          {isLoadingHistory ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-1/3 mx-auto" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            scoreHistory.length > 0 && <ScoreHistoryChart scoreHistory={scoreHistory} />
          )}

          <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
            <RefreshCw className="mr-2" />
            Recommencer un autre exercice
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!exerciseData) {
    return <Card className="w-full shadow-2xl p-8 text-center">Chargement des questions...</Card>;
  }

  const renderQCM = () => (
    <>
      {skill.slug === 'time' && typeof exerciseData.hour === 'number' && typeof exerciseData.minute === 'number' ? (
        <AnalogClock hour={exerciseData.hour} minute={exerciseData.minute} />
      ) : exerciseData.images ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {exerciseData.images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              alt={image.alt}
              className="max-h-24 rounded-lg object-contain"
              data-ai-hint={image.hint}
            />
          ))}
        </div>
      ) : exerciseData.image ? (
        <img
          src={exerciseData.image}
          alt={exerciseData.question}
          width={400}
          height={200}
          className="rounded-lg object-contain max-h-32"
          data-ai-hint={exerciseData.hint}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {exerciseData.options?.map((option: string, index: number) => (
          <Button
            key={`${option}-${index}`}
            variant="outline"
            onClick={() => handleAnswer(option)}
            className={cn(
              "text-xl h-20 p-4 justify-center transition-all duration-300 transform active:scale-95",
              feedback === 'correct' && option === exerciseData.answer && 'bg-green-500/80 text-white border-green-600 scale-105',
              feedback === 'incorrect' && option !== exerciseData.answer && 'bg-red-500/80 text-white border-red-600 animate-shake',
              feedback && option !== exerciseData.answer && 'opacity-50',
              feedback && option === exerciseData.answer && 'opacity-100'
            )}
            disabled={!!feedback}
          >
            <span className="flex items-center gap-4">
              {feedback === 'correct' && option === exerciseData.answer && <Check />}
              {feedback === 'incorrect' && option !== exerciseData.answer && <X />}
              {option}
            </span>
          </Button>
        ))}
      </div>
    </>
  );

  const renderComposeSum = () => (
    <div className="flex flex-col items-center justify-center space-y-8">
      <p className="text-2xl font-bold">
        Montant cible: {formatCurrency(exerciseData.targetAmount || 0)}
      </p>
      {/* This is where the interactive part will go */}
      <p className="text-muted-foreground">(Interface de composition à venir)</p>
    </div>
  );

  return (
    <>
      <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mb-4" />
      <Card className="w-full shadow-2xl relative overflow-hidden">
        {showConfetti && (
           <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(30)].map((_, i) => {
               const style = {
                left: `${Math.random() * 100}%`,
                animation: `fall ${Math.random() * 2 + 3}s linear ${Math.random() * 2}s infinite`,
                transform: `scale(${Math.random() * 0.5 + 0.5})`,
               };
               const Icon = icons[i % icons.length];
               return <div key={i} style={style} className="absolute top-[-10%]">{Icon}</div>
             })}
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-3xl text-center font-body">{exerciseData.question}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-8 min-h-[300px]">
          {exerciseData.type === 'qcm' && renderQCM()}
          {exerciseData.type === 'compose-sum' && renderComposeSum()}
        </CardContent>
        <CardFooter className="h-24 flex items-center justify-center">
          {feedback === 'correct' && (
            <div className="text-2xl font-bold text-green-600 animate-pulse">{motivationalMessage}</div>
          )}
        </CardFooter>
        <style jsx>{`
          @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
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
    </>
  );
}
