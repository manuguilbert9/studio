
'use client';

import { useState } from 'react';
import { AnalogClock } from './analog-clock';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import type { TimeSettings } from '@/lib/questions';
import { cn } from '@/lib/utils';

interface InteractiveClockProps {
  hour: number;
  minute: number;
  settings: TimeSettings;
  onSubmit: (h: number, m: number) => void;
  feedback: 'correct' | 'incorrect' | null;
}

export function InteractiveClock({ hour, minute, settings, onSubmit, feedback }: InteractiveClockProps) {
  // Initialize with a neutral time, like 12:00
  const [displayHour, setDisplayHour] = useState(12);
  const [displayMinute, setDisplayMinute] = useState(0);

  const targetTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  const handleHourClick = (h: number) => {
    setDisplayHour(h);
  };

  const handleMinuteClick = (m: number) => {
    setDisplayMinute(m);
  };

  const handleSubmit = () => {
    // In afternoon levels, we need to decide if 1 o'clock is 1 or 13.
    // A simple heuristic: if target is PM, and set hour is < 12, add 12.
    let submittedHour = displayHour;
    if (hour >= 13 && submittedHour > 0 && submittedHour < 12) {
        submittedHour += 12;
    }
    // Handle midnight case: if target is 00:xx, a click on 12 should be 0.
    if (hour === 0 && submittedHour === 12) {
        submittedHour = 0;
    }

    onSubmit(submittedHour, displayMinute);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      <p className="text-2xl font-semibold font-body">
        Règle l'horloge sur <span className="font-bold font-numbers text-primary">{targetTime}</span>
      </p>
      
      <div className="cursor-pointer">
        <AnalogClock
            hour={displayHour}
            minute={displayMinute}
            showMinuteCircle={settings.showMinuteCircle}
            matchColors={settings.matchColors}
            coloredHands={settings.coloredHands}
            onHourClick={handleHourClick}
            onMinuteClick={handleMinuteClick}
        />
      </div>


      <Button
        size="lg"
        className={cn("w-full max-w-sm text-xl py-7",
            feedback === 'correct' ? "bg-green-500 hover:bg-green-600" : 
            feedback === 'incorrect' ? "bg-red-500 hover:bg-red-600 animate-shake" :
            "bg-accent text-accent-foreground hover:bg-accent/90"
        )}
        onClick={handleSubmit}
        disabled={feedback !== null}
      >
        <Check className="mr-2" />
        Valider
      </Button>
    </div>
  );
}
