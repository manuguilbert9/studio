
'use client';

import { useState, useMemo, useEffect, useContext } from 'react';
import type { SkillLevel } from '@/lib/skills';
import { generateCalendarQuestions, type CalendarQuestion } from '@/lib/calendar-questions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, RefreshCw, X, Loader2 } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { Progress } from '@/components/ui/progress';
import { UserContext } from '@/context/user-context';
import { addScore, ScoreDetail } from '@/services/scores';
import { ScoreTube } from './score-tube';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';

const NUM_QUESTIONS = 5;

const skillLevels: { value: SkillLevel, label: string }[] = [
    { value: 'A', label: 'Niveau A - Maternelle' },
    { value: 'B', label: 'Niveau B - CP/CE1' },
    { value: 'C', label: 'Niveau C - CE2/CM1' },
    { value: 'D', label: 'Niveau D - CM2/6ème' },
];

export function CalendarExercise() {
  const { student } = useContext(UserContext);
  const [level, setLevel] = useState<SkillLevel | null>(null);
  
  const [questions, setQuestions] = useState<CalendarQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<ScoreDetail[]>([]);

  // User input states
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedOption, setSelectedOption] = useState<string | undefined>();
  const [inputValue, setInputValue] = useState<string>('');


  useEffect(() => {
    if (student?.levels?.['calendar']) {
      setLevel(student.levels['calendar']);
    } else {
      setLevel('A'); // Default level if not logged in or no level set
    }
  }, [student]);

  const startExercise = async (lvl: SkillLevel) => {
    setIsLoading(true);
    const generatedQuestions = await generateCalendarQuestions(lvl, NUM_QUESTIONS);
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setIsFinished(false);
    setHasBeenSaved(false);
    setSessionDetails([]);
    setSelectedDay(undefined);
    setSelectedOption(undefined);
    setInputValue('');
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (level) {
        startExercise(level);
    }
  }, [level]);

  const currentQuestion = useMemo(() => {
    if (questions.length > 0) {
      return questions[currentQuestionIndex];
    }
    return null;
  }, [questions, currentQuestionIndex]);

  const handleNextQuestion = () => {
    setShowConfetti(false);
    if (currentQuestionIndex < NUM_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setFeedback(null);
      setSelectedDay(undefined);
      setSelectedOption(undefined);
      setInputValue('');
    } else {
      setIsFinished(true);
    }
  };
  
  const getCorrectAnswerText = () => {
    if (!currentQuestion) return '';
    switch (currentQuestion.type) {
      case 'qcm':
        return currentQuestion.answer;
      case 'click-date':
        return currentQuestion.answerDate ? new Date(currentQuestion.answerDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      case 'count-days':
        return String(currentQuestion.answerNumber);
      default:
        return '';
    }
  };
  
  const getUserAnswerText = () => {
      if (!currentQuestion) return '';
      switch (currentQuestion.type) {
        case 'qcm':
            return selectedOption || "N/A";
        case 'click-date':
            return selectedDay ? selectedDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A";
        case 'count-days':
            return inputValue || "N/A";
        default:
            return "N/A";
      }
  }


  const checkAnswer = () => {
    if (!currentQuestion || feedback) return;
    
    let isCorrect = false;
    switch(currentQuestion.type) {
        case 'qcm':
            isCorrect = selectedOption === currentQuestion.answer;
            break;
        case 'click-date':
             if (selectedDay && currentQuestion.answerDate) {
                const selected = new Date(selectedDay.setHours(12, 0, 0, 0));
                const answer = new Date(new Date(currentQuestion.answerDate).setHours(12, 0, 0, 0));
                isCorrect = selected.getTime() === answer.getTime();
            }
            break;
        case 'count-days':
             isCorrect = parseInt(inputValue, 10) === currentQuestion.answerNumber;
             break;
    }
    
    const detail: ScoreDetail = {
        question: currentQuestion.question,
        userAnswer: getUserAnswerText(),
        correctAnswer: getCorrectAnswerText() || '',
        status: isCorrect ? 'correct' : 'incorrect',
    };
    setSessionDetails(prev => [...prev, detail]);

    if (isCorrect) {
      setFeedback('correct');
      setCorrectAnswers(prev => prev + 1);
      setShowConfetti(true);
    } else {
      setFeedback('incorrect');
    }
    setTimeout(handleNextQuestion, 2000);
  };
  
  useEffect(() => {
      const saveFinalScore = async () => {
           if (isFinished && student && !hasBeenSaved && level) {
              setHasBeenSaved(true);
              const score = (correctAnswers / NUM_QUESTIONS) * 100;
              await addScore({
                  userId: student.id,
                  skill: 'calendar',
                  score: score,
                  calendarSettings: { level: level },
                  details: sessionDetails,
              });
          }
      }
      saveFinalScore();
  }, [isFinished, student, correctAnswers, hasBeenSaved, level, sessionDetails]);

  const restartExercise = () => {
    if(level) {
        startExercise(level);
    }
  };

  if (!level) {
      // Level selector if no student level is found
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
                        {skillLevels.map(lvl => (
                            <SelectItem key={lvl.value} value={lvl.value}>{lvl.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
      );
  }

  if (isLoading || !currentQuestion) {
    return <Card className="w-full shadow-2xl p-8 text-center"><Loader2 className="mx-auto animate-spin" /></Card>;
  }

  if (isFinished) {
    const score = (correctAnswers / NUM_QUESTIONS) * 100;
    return (
      <Card className="w-full max-w-lg mx-auto shadow-2xl text-center p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-headline mb-4">Exercice terminé !</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-2xl">
            Tu as obtenu <span className="font-bold text-primary">{correctAnswers}</span> bonnes réponses sur <span className="font-bold">{NUM_QUESTIONS}</span>.
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

  const renderQuestion = () => {
      switch(currentQuestion.type) {
          case 'qcm':
              return (
                  <div className='flex flex-col items-center gap-4'>
                    {currentQuestion.month && (
                         <DayPicker
                            mode="single"
                            locale={fr}
                            month={new Date(currentQuestion.month)}
                            className="p-4 rounded-md border bg-card"
                            classNames={{
                                day_today: "font-bold text-accent",
                            }}
                            modifiers={{
                                highlighted: currentQuestion.highlightedDays?.map(d => new Date(d)) || [],
                            }}
                            modifiersClassNames={{
                                highlighted: "bg-primary/20 ring-2 ring-primary rounded-full",
                            }}
                        />
                    )}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                        {currentQuestion.options?.map(option => (
                            <Button
                            key={option}
                            variant={selectedOption === option ? 'default' : 'outline'}
                            onClick={() => setSelectedOption(option)}
                            className={cn(
                                "text-xl h-20 p-4 justify-center capitalize",
                                feedback === 'correct' && option === currentQuestion.answer && 'bg-green-500/80 text-white border-green-600 scale-105',
                                feedback === 'incorrect' && selectedOption === option && 'bg-red-500/80 text-white border-red-600 animate-shake',
                            )}
                            disabled={!!feedback}
                            >
                                {option}
                            </Button>
                        ))}
                    </div>
                  </div>
              )
          case 'click-date':
              return (
                  <DayPicker
                    mode="single"
                    selected={selectedDay}
                    onSelect={setSelectedDay}
                    locale={fr}
                    month={currentQuestion.month ? new Date(currentQuestion.month) : undefined}
                    className="p-4 rounded-md border bg-card"
                    classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                        day_today: "font-bold text-accent",
                    }}
                    modifiers={{
                        highlighted: currentQuestion.highlightedDays?.map(d => new Date(d)) || [],
                    }}
                    modifiersClassNames={{
                        highlighted: "bg-accent/20 rounded-full",
                    }}
                   />
              )
          case 'count-days':
                return (
                     <div className="flex flex-col items-center gap-4">
                        {currentQuestion.month && (
                            <DayPicker
                                mode="single"
                                locale={fr}
                                month={new Date(currentQuestion.month)}
                                className="p-4 rounded-md border bg-card"
                                classNames={{
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                                    day_today: "font-bold text-accent",
                                }}
                            />
                        )}
                        <InputOTP maxLength={2} value={inputValue} onChange={setInputValue}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                            </InputOTPGroup>
                        </InputOTP>
                     </div>
                )
      }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
       <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mb-4" />
        <Card className="shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Confetti active={showConfetti} config={{angle: 90, spread: 360, startVelocity: 40, elementCount: 100, dragFriction: 0.12, duration: 2000, stagger: 3, width: "10px", height: "10px"}} />
            </div>

            <CardHeader>
                <CardTitle className="font-headline text-2xl">{currentQuestion.question}</CardTitle>
                {currentQuestion.description && (
                     <CardDescription>{currentQuestion.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="min-h-[350px] flex flex-col items-center justify-center gap-8 p-6">
                {renderQuestion()}
            </CardContent>
            <CardFooter className="h-24 flex flex-col items-center justify-center gap-2">
                 <Button
                    onClick={checkAnswer}
                    disabled={!!feedback || (!selectedDay && !selectedOption && !inputValue)}
                    size="lg"
                    className="w-full max-w-md"
                  >
                    Valider
                </Button>
                 {feedback === 'incorrect' && (
                    <div className="text-md font-bold text-red-600 animate-shake pt-2 capitalize">
                        Oups ! La bonne réponse était {getCorrectAnswerText()}.
                    </div>
                )}
                 {feedback === 'correct' && (
                    <div className="text-xl font-bold text-green-600 animate-pulse pt-2">
                        Excellent !
                    </div>
                )}
            </CardFooter>
        </Card>
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
    </div>
  );
}

