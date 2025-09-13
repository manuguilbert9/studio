

'use client';

import type { Skill, SkillLevel } from '@/lib/skills';
import { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Heart, Sparkles, Star, ThumbsUp, X, RefreshCw, Trash2, ArrowRight, Volume2 } from 'lucide-react';
import { AnalogClock } from './analog-clock';
import { generateQuestions, type Question, type CalculationSettings as CalcSettings, type CurrencySettings as CurrSettings, type TimeSettings as TimeSettingsType, type CountSettings as CountSettingsType, type NumberLevelSettings } from '@/lib/questions';
import { currency as currencyData, formatCurrency } from '@/lib/currency';
import { Progress } from '@/components/ui/progress';
import { ScoreHistoryDisplay } from './score-history-display';
import { Skeleton } from './ui/skeleton';
import { ScoreTube } from './score-tube';
import { CalculationSettings } from './calculation-settings';
import { CurrencySettings } from './currency-settings';
import { TimeSettings } from './time-settings';
import { CountSettings } from './count-settings';
import { PriceTag } from './price-tag';
import { InteractiveClock } from './interactive-clock';
import { UserContext } from '@/context/user-context';
import { addScore, getScoresForUser, Score } from '@/services/scores';
import { saveHomeworkResult } from '@/services/homework';
import { format } from 'date-fns';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';


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

interface ExerciseWorkspaceProps {
  skill: Skill;
  isTableauMode?: boolean;
}

export function ExerciseWorkspace({ skill, isTableauMode = false }: ExerciseWorkspaceProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const isHomework = from === 'devoirs';
  const homeworkDate = searchParams.get('date');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  
  const { student, isLoading: isUserLoading } = useContext(UserContext);

  const [scoreHistory, setScoreHistory] = useState<Score[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [calculationSettings, setCalculationSettings] = useState<CalcSettings | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrSettings | null>(null);
  const [timeSettings, setTimeSettings] = useState<TimeSettingsType | null>(null);
  const [countSettings, setCountSettings] = useState<CountSettingsType | null>(null);
  const [numberLevelSettings, setNumberLevelSettings] = useState<NumberLevelSettings | null>(null);
  const [isReadyToStart, setIsReadyToStart] = useState(false);

  // useRef to hold a stable reference to settings for the save effect
  const settingsRef = useRef<any>(null);
  useEffect(() => {
    settingsRef.current = {
      time: timeSettings,
      count: countSettings,
      numberLevel: numberLevelSettings,
      calculation: calculationSettings,
      currency: currencySettings,
    };
  }, [timeSettings, countSettings, numberLevelSettings, calculationSettings, currencySettings]);
  
  // State for compose-sum
  const [composedAmount, setComposedAmount] = useState(0);
  const [selectedCoins, setSelectedCoins] = useState<{ src: string; alt: string; value: number }[]>([]);

  // State for select-multiple
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // State for count
  const [countedIndices, setCountedIndices] = useState<number[]>([]);
  
  // State for audio/written QCMs
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    // For non-configurable skills
    if (!['calculation', 'currency', 'time', 'denombrement', 'lire-les-nombres', 'ecoute-les-nombres'].includes(skill.slug)) {
      generateQuestions(skill.slug, NUM_QUESTIONS).then(setQuestions);
      setIsReadyToStart(true);
    } 
    // For configurable skills that ARE homework, use default settings
    else if (isHomework) {
       const defaultCalcSettings = { operations: 0, numberSize: 1, complexity: 0 };
       const defaultCurrSettings = { difficulty: 1 };
       const defaultTimeSettings = { level: 'A' as SkillLevel, showMinuteCircle: true, matchColors: true, coloredHands: true };
       const defaultCountSettings = { maxNumber: 10 };
       const defaultNumberLevelSettings = { level: 'A' as SkillLevel };
       
       if (skill.slug === 'calculation') startCalculationExercise(defaultCalcSettings);
       else if (skill.slug === 'currency') startCurrencyExercise(defaultCurrSettings);
       else if (skill.slug === 'time') startTimeExercise(defaultTimeSettings);
       else if (skill.slug === 'denombrement') startCountExercise(defaultCountSettings);
       else if (skill.slug === 'lire-les-nombres') startNumberLevelExercise(defaultNumberLevelSettings);
       else if (skill.slug === 'ecoute-les-nombres') {
            generateQuestions(skill.slug, NUM_QUESTIONS).then(setQuestions);
            setIsReadyToStart(true);
       }
    }
    // For configurable skills in 'en-classe' mode, derive level from student profile
    else if (['time', 'lire-les-nombres'].includes(skill.slug) && !isUserLoading && !isHomework) {
        const studentLevel = student?.levels?.[skill.slug] || 'A';
        
        if (skill.slug === 'time') {
             const settings: TimeSettingsType = {
                level: studentLevel,
                showMinuteCircle: studentLevel !== 'D',
                matchColors: studentLevel === 'A',
                coloredHands: studentLevel === 'A' || studentLevel === 'B',
            };
            startTimeExercise(settings);
        }
        if (skill.slug === 'lire-les-nombres') {
            startNumberLevelExercise({level: studentLevel});
        }
    } else if (skill.slug === 'ecoute-les-nombres' && !isHomework) {
         generateQuestions(skill.slug, NUM_QUESTIONS).then(setQuestions);
         setIsReadyToStart(true);
    }
  }, [skill.slug, isHomework, student, isUserLoading]);
  
  const startCalculationExercise = (settings: CalcSettings) => {
    setCalculationSettings(settings);
    generateQuestions(skill.slug, NUM_QUESTIONS, { calculation: settings }).then(setQuestions);
    setIsReadyToStart(true);
  };
  
  const startCurrencyExercise = (settings: CurrSettings) => {
    setCurrencySettings(settings);
    generateQuestions(skill.slug, NUM_QUESTIONS, { currency: settings }).then(setQuestions);
    setIsReadyToStart(true);
  };

  const startTimeExercise = (settings: TimeSettingsType) => {
    setTimeSettings(settings); // Set settings in state once
    generateQuestions(skill.slug, NUM_QUESTIONS, { time: settings }).then(setQuestions);
    setIsReadyToStart(true);
  }

  const startCountExercise = (settings: CountSettingsType) => {
    setCountSettings(settings);
    generateQuestions(skill.slug, NUM_QUESTIONS, { count: settings }).then(setQuestions);
    setIsReadyToStart(true);
  };

   const startNumberLevelExercise = (settings: NumberLevelSettings) => {
    setNumberLevelSettings(settings);
    generateQuestions(skill.slug, NUM_QUESTIONS, { numberLevel: settings }).then(setQuestions);
    setIsReadyToStart(true);
  };

  const exerciseData = useMemo(() => {
    if (questions.length === 0) return null;
    return questions[currentQuestionIndex];
  }, [currentQuestionIndex, questions]);
  
  const resetInteractiveStates = () => {
    setComposedAmount(0);
    setSelectedCoins([]);
    setSelectedIndices([]);
    setCountedIndices([]);
    setSelectedOption(null);
    setFeedback(null);
  }

  const handleNextQuestion = () => {
    setShowConfetti(false);
    resetInteractiveStates();
    if (currentQuestionIndex < NUM_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (isTableauMode) {
        restartExercise();
      } else {
        setIsFinished(true);
      }
    }
  };
  
  const processCorrectAnswer = () => {
      setCorrectAnswers(prev => prev + 1);
      setFeedback('correct');
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationalMessage(randomMessage);
      setShowConfetti(true);
      setTimeout(handleNextQuestion, 2500);
  }
  
  const processIncorrectAnswer = () => {
      setFeedback('incorrect');
      setTimeout(handleNextQuestion, 1500);
  }
  
  const handleQcmAnswer = (option: string) => {
    if (!exerciseData || feedback || !exerciseData.answer) return;

    if (option === exerciseData.answer) {
      processCorrectAnswer();
    } else {
      processIncorrectAnswer();
    }
  };
  
  const handleGenericQcmSubmit = () => {
    if (!exerciseData || feedback || !selectedOption) return;
    handleQcmAnswer(selectedOption);
  }

  const handleCountSubmit = (answer: number) => {
    if (!exerciseData || feedback || typeof exerciseData.countNumber === 'undefined') return;
    
    if (answer === exerciseData.countNumber) {
      processCorrectAnswer();
    } else {
      processIncorrectAnswer();
    }
  };
  
  const handleComposeSumSubmit = () => {
    if (!exerciseData || feedback || typeof exerciseData.targetAmount === 'undefined') return;
    
    if (composedAmount === exerciseData.targetAmount) {
      processCorrectAnswer();
    } else {
      processIncorrectAnswer();
    }
  }

  const handleSelectMultipleSubmit = () => {
    if (!exerciseData || feedback || !exerciseData.items || typeof exerciseData.correctValue === 'undefined') return;
    
    const correctIndices = exerciseData.items.reduce((acc: number[], item, index) => {
        if (item.value === exerciseData.correctValue) {
            acc.push(index);
        }
        return acc;
    }, []);

    const isCorrect = selectedIndices.length === correctIndices.length && 
                      selectedIndices.every(index => correctIndices.includes(index)) &&
                      correctIndices.every(index => selectedIndices.includes(index));

    if (isCorrect) {
        processCorrectAnswer();
    } else {
        processIncorrectAnswer();
    }
  }

  const handleSetTimeSubmit = (h: number, m: number) => {
    if (!exerciseData || feedback) return;
    const { hour, minute } = exerciseData;

    if (h === hour && m === minute) {
      processCorrectAnswer();
    } else {
      processIncorrectAnswer();
    }
  }

  const handleAddToSum = (item: { name: string; value: number; image: string; hint?: string }) => {
    setComposedAmount(prev => prev + item.value);
    setSelectedCoins(prev => [...prev, {src: item.image, alt: item.name, value: item.value}].sort((a,b) => b.value - a.value));
  }
  
  const handleToggleSelectItem = (index: number) => {
    setSelectedIndices(prev => 
        prev.includes(index) 
            ? prev.filter(i => i !== index)
            : [...prev, index]
    );
  };

  const handleToggleCountedItem = (index: number) => {
    setCountedIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };
  
   // Using a flag to prevent multiple saves
  const hasSavedRef = useRef(false);

  useEffect(() => {
    const saveResult = async () => {
      if (isFinished && student && !hasSavedRef.current && !isTableauMode) {
        hasSavedRef.current = true; // Set flag immediately
        
        const scoreValue = (correctAnswers / NUM_QUESTIONS) * 100;

        if (isHomework && homeworkDate) {
          await saveHomeworkResult({
            userId: student.id,
            date: homeworkDate,
            skillSlug: skill.slug,
            score: scoreValue,
          });
          setIsLoadingHistory(false); // No history to load for homework
        } else {
          setIsLoadingHistory(true);
          const scoreData: Omit<Score, 'createdAt' | 'id'> = {
            userId: student.id,
            skill: skill.slug,
            score: scoreValue,
          };
          
          const currentSettings = settingsRef.current;
          if (skill.slug === 'calculation' && currentSettings.calculation) scoreData.calculationSettings = currentSettings.calculation;
          if (skill.slug === 'currency' && currentSettings.currency) scoreData.currencySettings = currentSettings.currency;
          if (skill.slug === 'time' && currentSettings.time) scoreData.timeSettings = currentSettings.time;
          if (skill.slug === 'denombrement' && currentSettings.count) scoreData.countSettings = currentSettings.count;
          if (skill.slug === 'lire-les-nombres' && currentSettings.numberLevel) scoreData.numberLevelSettings = currentSettings.numberLevel;

          
          await addScore(scoreData);
          
          try {
            const userSkillHistory = await getScoresForUser(student.id, skill.slug);
            setScoreHistory(userSkillHistory);
          } catch (e) {
            console.error("Error fetching scores: ", e);
          } finally {
            setIsLoadingHistory(false);
          }
        }
      }
    };
    
    saveResult();
  }, [isFinished, student, skill.slug, correctAnswers, isTableauMode, isHomework, homeworkDate]);
  
  const restartExercise = () => {
    hasSavedRef.current = false;
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
    setScoreHistory([]);
    setIsLoadingHistory(true);
    setIsReadyToStart(false);
    setCalculationSettings(null);
    setCurrencySettings(null);
    setTimeSettings(null);
    setCountSettings(null);
    setNumberLevelSettings(null);
    resetInteractiveStates();
    // For non-configurable skills, just regenerate
    if (!['calculation', 'currency', 'time', 'denombrement', 'lire-les-nombres', 'ecoute-les-nombres'].includes(skill.slug)) {
      generateQuestions(skill.slug, NUM_QUESTIONS).then(setQuestions);
      setIsReadyToStart(true);
    }
  };
  
    const handleSpeak = (text: string) => {
        if (!text || !('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

  if (!isReadyToStart) {
      if (skill.slug === 'calculation' && !isHomework) return <CalculationSettings onStart={startCalculationExercise} />;
      if (skill.slug === 'currency' && !isHomework) return <CurrencySettings onStart={startCurrencyExercise} />;
      if (skill.slug === 'denombrement' && !isHomework) return <CountSettings onStart={startCountExercise} />;
      // Time & NumberLevel exercises now load automatically, so we just show a loading state
      return <Card className="w-full shadow-2xl p-8 text-center">Chargement de l'exercice...</Card>;
  }

  if (isFinished && !isTableauMode) {
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
         
          {isHomework ? (
            <p className="text-muted-foreground">Tes devoirs sont terminés !</p>
          ) : isLoadingHistory ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-1/3 mx-auto" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            scoreHistory.length > 0 && <ScoreHistoryDisplay scoreHistory={scoreHistory} />
          )}

          {!isHomework && (
            <Button onClick={restartExercise} variant="outline" size="lg" className="mt-4">
              <RefreshCw className="mr-2" />
              Recommencer un autre exercice
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!exerciseData) {
    return <Card className="w-full shadow-2xl p-8 text-center">Chargement des questions...</Card>;
  }

  const renderCount = () => (
    <div className="flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-6xl max-w-xl">
            {Array.from({length: exerciseData.countNumber || 0}).map((_, index) => (
                <button 
                  key={index}
                  onClick={() => handleToggleCountedItem(index)}
                  className={cn("transition-opacity duration-200",
                    countedIndices.includes(index) ? "opacity-30" : "opacity-100"
                  )}
                >
                  <span className="cursor-pointer select-none">{exerciseData.countEmoji}</span>
                </button>
            ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            {Array.from({length: countSettings?.maxNumber || 10}, (_, i) => i + 1).map((num) => (
                <Button 
                    key={num}
                    variant="outline"
                    onClick={() => handleCountSubmit(num)}
                    className={cn(
                        "h-16 w-16 text-3xl font-bold font-numbers",
                         feedback === 'correct' && num === exerciseData.countNumber && 'bg-green-500/80 text-white border-green-600 scale-105',
                         feedback === 'incorrect' && num !== exerciseData.countNumber && 'bg-red-500/80 text-white border-red-600 animate-shake'
                    )}
                    disabled={!!feedback}
                >
                    {num}
                </Button>
            ))}
        </div>
    </div>
);

  const renderQCM = () => (
    <>
      {skill.slug === 'time' && typeof exerciseData.hour === 'number' && typeof exerciseData.minute === 'number' ? (
        <AnalogClock
            hour={exerciseData.hour} 
            minute={exerciseData.minute} 
            showMinuteCircle={exerciseData.timeSettings?.showMinuteCircle}
            matchColors={exerciseData.timeSettings?.matchColors}
            coloredHands={exerciseData.timeSettings?.coloredHands}
        />
      ) : exerciseData.image ? (
        <img
          src={exerciseData.image}
          alt={exerciseData.question}
          width={400}
          height={200}
          className="rounded-lg object-contain max-h-32 mx-auto"
          data-ai-hint={exerciseData.hint}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {exerciseData.options?.map((option: string, index: number) => (
          <Button
            key={`${option}-${index}`}
            variant="outline"
            onClick={() => handleQcmAnswer(option)}
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

  const renderImageQCM = () => (
    <div className="flex flex-col items-center justify-center space-y-8">
      {exerciseData.syllable && (
        <div className="font-mono text-7xl font-bold p-4 bg-secondary rounded-lg">{exerciseData.syllable}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {exerciseData.images?.map((image, index) => (
          <button
            key={index}
            onClick={() => handleQcmAnswer(image.alt)}
            className={cn(
              "p-4 border-4 rounded-lg transition-all duration-300 transform active:scale-95 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-accent",
              feedback === 'correct' && image.alt === exerciseData.answer && 'border-green-500 scale-105',
              feedback === 'incorrect' && image.alt !== exerciseData.answer && 'border-red-500 animate-shake',
              feedback && image.alt !== exerciseData.answer && 'opacity-30',
              feedback && image.alt === exerciseData.answer && 'border-green-500',
              !feedback && 'border-transparent'
            )}
            disabled={!!feedback}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-32 object-contain"
              data-ai-hint={image.hint}
            />
          </button>
        ))}
      </div>
    </div>
  );

  
  const renderAudioQCM = () => (
    <div className="flex flex-col items-center gap-6 w-full">
        {exerciseData.textToSpeak && (
            <Button onClick={() => handleSpeak(exerciseData.textToSpeak!)}>
                <Volume2 className="mr-2"/> Écouter
            </Button>
        )}
        <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''} className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {exerciseData.options?.map(opt => (
            <div key={opt}>
                <RadioGroupItem value={opt} id={opt} className="sr-only" />
                <Label htmlFor={opt} className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-20 text-3xl font-numbers", selectedOption === opt && 'border-primary')}>
                    {opt}
                </Label>
            </div>
            ))}
        </RadioGroup>
    </div>
  );
  
  const renderWrittenToAudioQCM = () => (
    <div className="flex flex-col items-center gap-6 w-full">
        <p className="font-numbers text-8xl font-bold">{exerciseData.answer}</p>
        <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ''} className="grid grid-cols-2 gap-4 w-full max-w-md">
            {exerciseData.optionsWithAudio?.map(opt => (
                <div key={opt.text}>
                    <RadioGroupItem value={opt.text} id={opt.text} className="sr-only" />
                    <Label htmlFor={opt.text} className={cn("flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer h-20 text-xl", selectedOption === opt.text && 'border-primary')}>
                            <Button variant="ghost" size="icon" className="h-12 w-12" onClick={(e) => { e.preventDefault(); handleSpeak(opt.audio); }}>
                                <Volume2 className="h-8 w-8 text-muted-foreground" />
                            </Button>
                    </Label>
                </div>
            ))}
        </RadioGroup>
    </div>
  );

  const renderComposeSum = () => (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
        
        {typeof exerciseData.cost !== 'undefined' && exerciseData.paymentImages && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                  <p className="text-muted-foreground font-semibold">Prix de l'article</p>
                  <PriceTag price={formatCurrency(exerciseData.cost)} />
              </div>
              <ArrowRight className="h-8 w-8 text-muted-foreground hidden sm:block" />
              <div className="flex flex-col items-center gap-2">
                  <p className="text-muted-foreground font-semibold">Argent donné</p>
                  <div className="flex gap-2">
                  {exerciseData.paymentImages.map((item, index) => (
                      <img key={index} src={item.image} alt={item.name} className="h-16 object-contain" />
                  ))}
                  </div>
              </div>
          </div>
        )}

        <div className={cn("rounded-lg border-2 p-4 w-full text-center mb-4 transition-colors",
            feedback === 'correct' ? 'bg-green-100 border-green-500' :
            feedback === 'incorrect' ? 'bg-red-100 border-red-500' :
            'bg-secondary'
        )}>
            <p className="text-muted-foreground">Votre somme</p>
            <p className="text-4xl font-bold font-numbers">{formatCurrency(composedAmount)}</p>
            <div className="h-16 mt-2 flex flex-wrap gap-1 justify-center items-center overflow-y-auto">
                {selectedCoins.map((coin, index) => (
                    <img key={index} src={coin.src} alt={coin.alt} className="h-8 object-contain" />
                ))}
            </div>
        </div>

        <Card className="w-full p-4">
            <CardContent className="flex flex-wrap items-center justify-center gap-2 p-0">
                {currencyData.map((item) => (
                    <Button 
                        key={item.name} 
                        variant="ghost" 
                        onClick={() => handleAddToSum(item)}
                        disabled={!!feedback}
                        className="h-auto p-1 flex flex-col gap-1 items-center transform active:scale-95 hover:bg-accent/50"
                    >
                        <img src={item.image} alt={item.name} className="h-12 object-contain" />
                        <span className="text-xs font-numbers">{item.name}</span>
                    </Button>
                ))}
            </CardContent>
        </Card>

        <div className="flex w-full gap-4">
             <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => { setComposedAmount(0); setSelectedCoins([]); }}
                disabled={!!feedback}
            >
                <Trash2 className="mr-2" />
                Effacer
            </Button>
            <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleComposeSumSubmit}
                disabled={!!feedback}
            >
                <Check className="mr-2" />
                Valider
            </Button>
        </div>
    </div>
);

const renderSelectMultiple = () => (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
        <Card className="w-full p-4">
            <CardContent className="flex flex-wrap items-center justify-center gap-3 p-0">
                {exerciseData.items?.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => handleToggleSelectItem(index)}
                        disabled={!!feedback}
                        className={cn("h-auto p-1 rounded-md transform active:scale-95 transition-all",
                            selectedIndices.includes(index) ? 'ring-4 ring-accent' : 'ring-2 ring-transparent',
                            feedback === 'correct' && selectedIndices.includes(index) && 'ring-green-500',
                            feedback === 'incorrect' && selectedIndices.includes(index) && 'ring-red-500 animate-shake',
                            feedback && !selectedIndices.includes(index) && 'opacity-50'
                        )}
                    >
                        <img src={item.image} alt={item.name} className="h-14 object-contain" />
                    </button>
                ))}
            </CardContent>
        </Card>

        <div className="flex w-full gap-4 pt-4">
            <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleSelectMultipleSubmit}
                disabled={!!feedback || selectedIndices.length === 0}
            >
                <Check className="mr-2" />
                Valider
            </Button>
        </div>
    </div>
);

const renderSetTime = () => (
    <InteractiveClock
      hour={exerciseData.hour!}
      minute={exerciseData.minute!}
      onSubmit={handleSetTimeSubmit}
      settings={exerciseData.timeSettings!}
      feedback={feedback}
    />
)


  return (
    <div className={cn(!isTableauMode && "w-full")}>
      {!isTableauMode && <Progress value={((currentQuestionIndex + 1) / NUM_QUESTIONS) * 100} className="w-full mb-4" />}
      <Card className={cn(
        "w-full relative overflow-hidden",
        isTableauMode ? "shadow-none border-0 bg-transparent" : "shadow-2xl"
      )}>
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
          <CardTitle className={cn(
            "text-center font-body",
            isTableauMode ? "text-5xl" : "text-3xl"
            )}>{exerciseData.question}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-8 min-h-[300px] p-4 sm:p-6">
          {exerciseData.type === 'qcm' && renderQCM()}
          {exerciseData.type === 'image-qcm' && renderImageQCM()}
          {exerciseData.type === 'compose-sum' && renderComposeSum()}
          {exerciseData.type === 'select-multiple' && renderSelectMultiple()}
          {exerciseData.type === 'set-time' && renderSetTime()}
          {exerciseData.type === 'count' && renderCount()}
          {exerciseData.type === 'audio-qcm' && renderAudioQCM()}
          {exerciseData.type === 'written-to-audio-qcm' && renderWrittenToAudioQCM()}
        </CardContent>
        <CardFooter className="h-24 flex items-center justify-center">
         {(exerciseData.type === 'audio-qcm' || exerciseData.type === 'written-to-audio-qcm') ? (
            <div className='flex flex-col items-center gap-2'>
                <Button onClick={handleGenericQcmSubmit} disabled={!selectedOption || !!feedback}>Valider</Button>
                {feedback === 'incorrect' && <p className="text-destructive font-semibold">La bonne réponse était {exerciseData.answer}</p>}
                {feedback === 'correct' && <p className="text-green-600 font-semibold">{motivationalMessage}</p>}
            </div>
         ) : (
            <>
                {feedback === 'correct' && (
                    <div className="text-2xl font-bold text-green-600 animate-pulse">{motivationalMessage}</div>
                )}
                {feedback === 'incorrect' && (
                    <div className="text-2xl font-bold text-red-600 animate-shake">Oups ! Essaye encore.</div>
                )}
            </>
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
    </div>
  );
}
