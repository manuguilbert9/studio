'use client';

import type { Skill } from '@/lib/skills.tsx';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Heart, Sparkles, Star, ThumbsUp, X, RefreshCw } from 'lucide-react';
import { AnalogClock } from './analog-clock';
import { generateQuestions, type Question } from '@/lib/questions';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

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

  useEffect(() => {
    setQuestions(generateQuestions(skill.slug, NUM_QUESTIONS));
    const storedName = localStorage.getItem('skillfiesta_username');
    if (storedName) {
      setUsername(storedName);
    }
  }, [skill.slug]);

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
    if (feedback) return;

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
  
  const handleSaveScore = async () => {
    if (!username) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "scores"), {
        userId: username,
        skill: skill.slug,
        score: (correctAnswers / NUM_QUESTIONS) * 100,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      // Optionally: show a toast to the user
    } finally {
      setIsSaving(false);
      // Maybe navigate away or show a "Done" message
    }
  };
  
  const restartExercise = () => {
    setQuestions(generateQuestions(skill.slug, NUM_QUESTIONS));
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
  };

  if (isFinished) {
    const score = (correctAnswers / NUM_QUESTIONS) * 100;
    return (
      <Card className="w-full shadow-2xl text-center p-8">
        <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{NUM_QUESTIONS}</span>.
          </p>
          <p className="text-5xl font-bold text-accent">{score}%</p>
          {username && (
             <Button onClick={handleSaveScore} disabled={isSaving} size="lg">
              {isSaving ? "Enregistrement..." : "Enregistrer mon score"}
            </Button>
          )}
          <Button onClick={restartExercise} variant="outline" size="lg">
            <RefreshCw className="mr-2" />
            Recommencer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!exerciseData) {
    return <Card className="w-full shadow-2xl p-8 text-center">Chargement des questions...</Card>;
  }

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
               return <div key={i} style={style} className="absolute top-[-10%]">{icons[i % icons.length]}</div>
             })}
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-3xl text-center font-body">{exerciseData.question}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-8 min-h-[300px]">
          {skill.slug === 'time' && typeof exerciseData.hour === 'number' && typeof exerciseData.minute === 'number' ? (
            <AnalogClock hour={exerciseData.hour} minute={exerciseData.minute} />
          ) : exerciseData.image ? (
            <img
              src={exerciseData.image}
              alt={exerciseData.question}
              width={400}
              height={200}
              className="rounded-lg object-contain"
              data-ai-hint={exerciseData.hint}
            />
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
            {exerciseData.options.map((option: string) => (
              <Button
                key={option}
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
