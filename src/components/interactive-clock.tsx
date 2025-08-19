
'use client';

import { useState } from 'react';
import { AnalogClock } from './analog-clock';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import type { TimeSettings } from '@/lib/questions';

interface InteractiveClockProps {
  hour: number;
  minute: number;
  settings: TimeSettings;
  onSubmit: (h: number, m: number) => void;
}

export function InteractiveClock({ hour, minute, settings, onSubmit }: InteractiveClockProps) {
  // For now, the displayed time is static. This will be made interactive later.
  const [displayHour, setDisplayHour] = useState(12);
  const [displayMinute, setDisplayMinute] = useState(0);

  const targetTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      <p className="text-2xl font-semibold font-body">
        Réglez l'horloge sur <span className="font-bold font-numbers text-primary">{targetTime}</span>
      </p>

      <AnalogClock
        hour={displayHour}
        minute={displayMinute}
        showMinuteCircle={settings.showMinuteCircle}
        matchColors={settings.matchColors}
        coloredHands={settings.coloredHands}
      />

      <Button
        size="lg"
        className="w-full max-w-sm bg-accent text-accent-foreground hover:bg-accent/90 text-xl py-7"
        onClick={() => onSubmit(displayHour, displayMinute)}
        disabled // Disabled for now
      >
        <Check className="mr-2" />
        Valider
      </Button>
    </div>
  );
}
