

'use client';

import type { Skill } from '@/lib/skills.tsx';
import { useState, useMemo, useEffect, useContext } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Check, Heart, Sparkles, Star, ThumbsUp, X, RefreshCw, Volume2 } from 'lucide-react';
import { AnalogClock } from './analog-clock';
import { generateQuestions, type Question, type TimeSettings as TimeSettingsType, type CountSettings as CountSettingsType, type NumberLevelSettings as NumberLevelSettingsType } from '@/lib/questions';
import { Progress } from '@/components/ui/progress';
import { ScoreHistoryDisplay } from './score-history-display';
import { Skeleton } from './ui/skeleton';
import { ScoreTube } from './score-tube';
import { TimeSettings } from './time-settings';
import { CountSettings } from './count-settings';
import { NumberLevelSettings } from './number-level-settings';
import { InteractiveClock } from './interactive-clock';
import { UserContext } from '@/context/user-context';
import { addScore, getScoresForUser, Score, HomeworkSession } from '@/services/scores';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';


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
  homeworkSession?: HomeworkSession | null;
}

export function ExerciseWorkspace({ skill, isTableauMode = false, homeworkSession = null }: ExerciseWorkspaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  
  const { student, isLoading: isUserLoading } = useContext(UserContext);

  const [scoreHistory, setScoreHistory] = useState<Score[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [timeSettings, setTimeSettings] = useState<TimeSettingsType | null>(null);
  const [countSettings, setCountSettings] = useState<CountSettingsType | null>(null);
  const [numberLevelSettings, setNumberLevelSettings] = useState<NumberLevelSettingsType | null>(null);
  const [isReadyToStart, setIsReadyToStart] = useState(false);
  
  const [selectedAudioOption, setSelectedAudioOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');


  const playAudio = (text: string) => {
    if (text && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      // Stop any previously playing audio before starting a new one
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }

  useEffect(() => {
    async function loadQuestions() {
      // For skills that don't need settings, generate questions immediately
      if (!['time', 'denombrement', 'lire-les-nombres'].includes(skill.slug)) {
        const generatedQuestions = await generateQuestions(skill.slug, NUM_QUESTIONS);
        setQuestions(generatedQuestions);
        setIsReadyToStart(true);
      }
    }
    loadQuestions();
  }, [skill.slug]);
  
  // This effect handles auto-playing audio for audio questions
  useEffect(() => {
    const question = questions[currentQuestionIndex];
    if ((question?.type === 'audio-qcm' || question?.type === 'audio-to-text-input') && question.textToSpeak) {
        playAudio(question.textToSpeak);
    }
  }, [currentQuestionIndex, questions]);
  
  const startTimeExercise = (settings: TimeSettingsType) => {
    generateQuestions(skill.slug, NUM_QUESTIONS, { time: settings }).then(setQuestions);
    setTimeSettings(settings);
    setIsReadyToStart(true);
  }
  
  const startCountExercise = (settings: CountSettingsType) => {
    generateQuestions(skill.slug, NUM_QUESTIONS, { count: settings }).then(setQuestions);
    setCountSettings(settings);
    setIsReadyToStart(true);
  };
  
  const startNumberLevelExercise = (settings: NumberLevelSettingsType) => {
    generateQuestions(skill.slug, NUM_QUESTIONS, { numberLevel: settings }).then(setQuestions);
    setNumberLevelSettings(settings);
    setIsReadyToStart(true);
  }

  const exerciseData = useMemo(() => {
    if (questions.length === 0) return null;
    return questions[currentQuestionIndex];
  }, [currentQuestionIndex, questions]);
  
  const resetInteractiveStates = () => {
    setFeedback(null);
    setSelectedAudioOption(null);
    setTextInput('');
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
  
  const handleSetTimeSubmit = (h: number, m: number) => {
    if (!exerciseData || feedback) return;
    const { hour, minute } = exerciseData;

    if (h === hour && m === minute) {
      processCorrectAnswer();
    } else {
      processIncorrectAnswer();
    }
  }

  const handleAudioToTextInputSubmit = () => {
    if (!exerciseData || feedback) return;
    
    // Normalize and compare
    const userAnswer = textInput.trim().toLowerCase();
    const correctAnswerNum = exerciseData.answer; // e.g. "105"
    const correctAnswerWords = exerciseData.answerInWords?.trim().toLowerCase(); // e.g. "cent cinq"
    
    if (userAnswer === correctAnswerNum || userAnswer === correctAnswerWords) {
        processCorrectAnswer();
    } else {
        processIncorrectAnswer();
    }
  }
  
  useEffect(() => {
    const saveScoreAndFetchHistory = async () => {
      if (isFinished && student && !hasBeenSaved && !isTableauMode) {
        setHasBeenSaved(true);
        setIsLoadingHistory(true);
        
        const newScoreValue = (correctAnswers / NUM_QUESTIONS) * 100;
        
        const scoreData: Omit<Score, 'id' | 'createdAt'> = {
            userId: student.id,
            skill: skill.slug,
            score: newScoreValue,
        };

        if (timeSettings) scoreData.timeSettings = timeSettings;
        if (countSettings) scoreData.countSettings = countSettings;
        if (numberLevelSettings) scoreData.numberLevelSettings = numberLevelSettings;
        if (homeworkSession) scoreData.homeworkSession = homeworkSession;

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
    };
    
    saveScoreAndFetchHistory();
  }, [isFinished, student, skill.slug, correctAnswers, timeSettings, countSettings, numberLevelSettings, isTableauMode, hasBeenSaved, homeworkSession]);
  
  const restartExercise = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
    setScoreHistory([]);
    setIsLoadingHistory(true);
    setHasBeenSaved(false);
    setIsReadyToStart(false);
    setTimeSettings(null);
    setCountSettings(null);
    setNumberLevelSettings(null);
    resetInteractiveStates();
    if (!['time', 'denombrement', 'lire-les-nombres'].includes(skill.slug)) {
       generateQuestions(skill.slug, NUM_QUESTIONS).then(setQuestions);
       setIsReadyToStart(true);
    }
  };

  if (!isReadyToStart) {
      if (skill.slug === 'time') {
        return <TimeSettings onStart={startTimeExercise} />;
      }
      if (skill.slug === 'denombrement') {
        return <CountSettings onStart={startCountExercise} />;
      }
      if (skill.slug === 'lire-les-nombres') {
        return <NumberLevelSettings onStart={startNumberLevelExercise} />
      }
      // For other skills, this will show a loading state until questions are set.
       return (
            <Card className="w-full shadow-2xl p-8 text-center">
                Chargement de l'exercice...
            </Card>
        );
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
         
          {isLoadingHistory ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-1/3 mx-auto" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            scoreHistory.length > 0 && <ScoreHistoryDisplay scoreHistory={scoreHistory} />
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
        <AnalogClock
            hour={exerciseData.hour} 
            minute={exerciseData.minute} 
            showMinuteCircle={exerciseData.timeSettings?.showMinuteCircle}
            matchColors={exerciseData.timeSettings?.matchColors}
            coloredHands={exerciseData.timeSettings?.coloredHands}
        />
      ) : exerciseData.images && exerciseData.images.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {exerciseData.images.map((image, index) => (
            <Image
              key={index}
              src={image.src}
              alt={image.alt}
              width={96}
              height={96}
              className="rounded-lg object-contain"
              data-ai-hint={image.hint}
            />
          ))}
        </div>
      ) : exerciseData.image ? (
        <Image
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

  const renderAudioQCM = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full space-y-8">
            <Button onClick={() => playAudio(exerciseData.textToSpeak!)} size="lg" variant="outline" className="h-24 w-24 rounded-full">
                <Volume2 className="h-12 w-12" />
            </Button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
                {exerciseData.options?.map((option: string, index: number) => (
                    <Button
                        key={`${option}-${index}`}
                        variant="outline"
                        onClick={() => handleQcmAnswer(option)}
                        className={cn(
                        "text-5xl font-numbers h-24 p-4 justify-center transition-all duration-300 transform active:scale-95",
                        feedback === 'correct' && option === exerciseData.answer && 'bg-green-500/80 text-white border-green-600 scale-105',
                        feedback === 'incorrect' && option !== exerciseData.answer && 'bg-red-500/80 text-white border-red-600 animate-shake',
                        feedback && option !== exerciseData.answer && 'opacity-50',
                        feedback && option === exerciseData.answer && 'opacity-100'
                        )}
                        disabled={!!feedback}
                    >
                        {option}
                    </Button>
                ))}
            </div>
        </div>
    );
  };
  
  const renderWrittenToAudioQCM = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full space-y-8">
            <div className="font-numbers text-8xl font-bold text-primary">
                {exerciseData.textToSpeak}
            </div>
             <RadioGroup
                value={selectedAudioOption ?? undefined}
                onValueChange={setSelectedAudioOption}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg"
                disabled={!!feedback}
            >
                 {exerciseData.optionsWithAudio?.map((option, index) => {
                    const isCorrect = feedback === 'correct' && option.text === exerciseData.answer;
                    const isSelectedIncorrect = feedback === 'incorrect' && option.text === selectedAudioOption;
                    
                    return (
                        <div key={option.text} className="flex flex-col items-center gap-2">
                             <Button
                                variant="outline"
                                onClick={() => playAudio(option.audio)}
                                className={cn(
                                "h-24 w-full justify-center transition-all duration-300 transform active:scale-95",
                                 isCorrect && 'bg-green-500/80 text-white border-green-600 scale-105',
                                 isSelectedIncorrect && 'bg-red-500/80 text-white border-red-600 animate-shake',
                                 feedback && !isCorrect && !isSelectedIncorrect && 'opacity-50',
                                )}
                                disabled={!!feedback}
                            >
                                <Volume2 className="h-10 w-10"/>
                            </Button>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={option.text} id={`r-${option.text}`} />
                                <Label htmlFor={`r-${option.text}`} className="sr-only">{option.text}</Label>
                            </div>
                        </div>
                    )
                })}
            </RadioGroup>
            <Button
                size="lg"
                className="w-full max-w-lg"
                onClick={() => handleQcmAnswer(selectedAudioOption!)}
                disabled={!selectedAudioOption || !!feedback}
            >
                <Check className="mr-2"/> Valider
            </Button>
        </div>
    )
  }

  const renderAudioToTextInput = () => (
    <div className="flex flex-col items-center justify-center w-full space-y-8">
      <Button onClick={() => playAudio(exerciseData.textToSpeak!)} size="lg" variant="outline" className="h-24 w-24 rounded-full">
        <Volume2 className="h-12 w-12" />
      </Button>
      <div className="w-full max-w-md">
        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAudioToTextInputSubmit()}
          placeholder="Ta réponse..."
          className={cn("h-16 text-2xl text-center",
            feedback === 'correct' && 'border-green-500 ring-green-500',
            feedback === 'incorrect' && 'border-red-500 ring-red-500 animate-shake'
          )}
          disabled={!!feedback}
          autoFocus
        />
      </div>
      <Button
        size="lg"
        className="w-full max-w-md"
        onClick={handleAudioToTextInputSubmit}
        disabled={!textInput || !!feedback}
      >
        <Check className="mr-2" /> Valider
      </Button>
    </div>
  );

  const renderCount = () => (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      <div className="grid grid-cols-5 gap-2 text-4xl" style={{ gridTemplateRows: 'repeat(4, 1fr)' }}>
        {Array.from({ length: exerciseData.countNumber ?? 0 }).map((_, i) => (
          <span key={i} role="img" aria-label={exerciseData.question}>
            {exerciseData.countEmoji}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
        {Array.from({ length: (countSettings?.maxNumber ?? 20) + 1 }, (_, i) => i).map((num) => (
          <Button
            key={num}
            variant="outline"
            onClick={() => handleQcmAnswer(String(num))}
            className={cn(
              'text-xl h-12 w-12 font-numbers transition-all duration-300 transform active:scale-95',
              feedback === 'correct' && String(num) === exerciseData.answer && 'bg-green-500/80 text-white border-green-600',
              feedback === 'incorrect' && String(num) !== exerciseData.answer && 'opacity-50',
              feedback && String(num) === exerciseData.answer && 'opacity-100'
            )}
            disabled={!!feedback}
          >
            {num}
          </Button>
        ))}
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
);


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
          {exerciseData.type === 'audio-qcm' && renderAudioQCM()}
          {exerciseData.type === 'written-to-audio-qcm' && renderWrittenToAudioQCM()}
          {exerciseData.type === 'audio-to-text-input' && renderAudioToTextInput()}
          {exerciseData.type === 'set-time' && renderSetTime()}
          {exerciseData.type === 'count' && renderCount()}
        </CardContent>
        <CardFooter className="h-24 flex items-center justify-center">
          {feedback === 'correct' && (
            <div className="text-2xl font-bold text-green-600 animate-pulse">{motivationalMessage}</div>
          )}
           {feedback === 'incorrect' && (
            <div className="text-2xl font-bold text-red-600 animate-shake">
                Oups ! La bonne réponse était {exerciseData.answer}.
            </div>
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
