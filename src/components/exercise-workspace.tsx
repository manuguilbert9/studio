'use client';

import type { Skill } from '@/lib/skills.tsx';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Heart, Sparkles, Star, ThumbsUp, X } from 'lucide-react';
import { AnalogClock } from './analog-clock';

const questions = {
  time: [
    { 
      question: 'Quelle heure est-il sur l\'horloge ?', 
      hour: 3, 
      minute: 0,
      options: ['3:00', '9:00', '12:30', '6:00'], 
      answer: '3:00', 
    },
  ],
  writing: [
    { question: 'Quel mot est correctement orthographié ?', image: null, options: ['Éléfan', 'Éléphant', 'Éléfant', 'Éléfen'], answer: 'Éléphant', hint: 'orthographe animal' },
  ],
  currency: [
    { question: 'Combien d\'argent y a-t-il ?', image: 'https://placehold.co/300x150.png', options: ['1,25 €', '0,75 €', '1,50 €', '2,00 €'], answer: '1,25 €', hint: 'pièces euros' },
  ],
  reading: [
    { question: 'Lisez l\'histoire et répondez : Qu\'a mangé le renard ?', image: 'https://placehold.co/600x100.png', options: ['Des raisins', 'Du fromage', 'Du poulet', 'Du poisson'], answer: 'Des raisins', hint: 'livre histoire' },
  ],
  calculation: [
    { question: 'Combien font 5 + 7 ?', image: null, options: ['10', '11', '12', '13'], answer: '12', hint: 'équation mathématique' },
  ],
  default: [
    { question: 'Ceci est un exemple de question. Choisissez la bonne réponse.', image: null, options: ['Bonne réponse', 'Mauvaise réponse', 'Mauvaise réponse', 'Mauvaise réponse'], answer: 'Bonne réponse', hint: 'point d\'interrogation' },
  ]
};

const motivationalMessages = [
  "Excellent travail !", "Tu es une star !", "Incroyable !", "Continue comme ça !", "Fantastique !", "Bien joué !"
];
const icons = [
  <Star key="star" className="h-8 w-8 text-yellow-400" />,
  <ThumbsUp key="thumbsup" className="h-8 w-8 text-blue-500" />,
  <Heart key="heart" className="h-8 w-8 text-red-500" />,
  <Sparkles key="sparkles" className="h-8 w-8 text-amber-500" />,
];

export function ExerciseWorkspace({ skill }: { skill: Skill }) {
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  
  const exerciseData = useMemo(() => {
    return (questions as any)[skill.slug]?.[0] || questions.default[0]
  }, [skill.slug]);

  const handleAnswer = (option: string) => {
    if (feedback) return;

    if (option === exerciseData.answer) {
      setFeedback('correct');
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationalMessage(randomMessage);
      setShowConfetti(true);
      setTimeout(() => {
        setFeedback(null);
        setShowConfetti(false);
      }, 2500);
    } else {
      setFeedback('incorrect');
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  };

  return (
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
        {skill.slug === 'time' ? (
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
  );
}
