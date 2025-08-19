
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  isCorrect: boolean | null;
}

export function InteractiveClock({ hour, minute, settings, onSubmit, isCorrect }: InteractiveClockProps) {
  const clockRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Initialize with a neutral time, like 12:00
  const [displayHour, setDisplayHour] = useState(12);
  const [displayMinute, setDisplayMinute] = useState(0);

  const targetTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  const handleInteraction = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!clockRef.current) return;

    const clockRect = clockRef.current.getBoundingClientRect();
    const centerX = clockRect.left + clockRect.width / 2;
    const centerY = clockRect.top + clockRect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const angleRad = Math.atan2(clientY - centerY, clientX - centerX);
    let angleDeg = angleRad * (180 / Math.PI) + 90;
    if (angleDeg < 0) angleDeg += 360;

    // Convert angle to minutes (0-59)
    const newMinute = Math.round(angleDeg / 6) % 60;
    
    // Update hour based on minute
    // We get the current hour "sector"
    const currentHourCycle = Math.floor(displayHour / 12); 
    let newHour = Math.floor(angleDeg / 30);
    if(newHour === 0) newHour = 12;

    // This logic is tricky. For now, let's just move the hour hand based on the minute.
    // A simpler approach: calculate total minutes from 12:00
    const totalMinutes = displayHour * 60 + displayMinute;
    const minuteOfTheDay = Math.floor(angleDeg/360 * (12 * 60));
    
    const finalHour = Math.floor(minuteOfTheDay / 60);
    const finalMinute = minuteOfTheDay % 60;

    // Simplest logic for now: only the minute hand is directly draggable. Hour hand follows.
    const newDisplayHour = (displayHour % 12) + (newMinute / 60);
    
    setDisplayMinute(newMinute);
    // Let's adjust hour proportionally. Every 360 turn of minute hand should advance the hour hand.
    // We need to handle the hour crossing.
    const minuteDiff = newMinute - displayMinute;
    if (Math.abs(minuteDiff) > 30) { // Crossed the 12 o'clock
        if (minuteDiff > 0) { // from 55 to 5 for example
             setDisplayHour(prev => (prev - 1 + 12) % 12 || 12);
        } else { // from 5 to 55
             setDisplayHour(prev => (prev + 1) % 12 || 12);
        }
    }
    
    let currentHour = displayHour;
    // Check for crossing 12 o'clock
    if (displayMinute > 50 && newMinute < 10) { // Clockwise
        currentHour = (currentHour % 12) + 1;
        if(currentHour === 0) currentHour = 12;
    } else if (displayMinute < 10 && newMinute > 50) { // Counter-clockwise
        currentHour = (currentHour === 1 ? 12 : currentHour - 1);
    }
    
    setDisplayHour(Math.floor(currentHour));
    setDisplayMinute(newMinute);


  }, [displayHour, displayMinute]);

  const stopDragging = useCallback(() => {
    window.removeEventListener('mousemove', handleInteraction);
    window.removeEventListener('mouseup', stopDragging);
    window.removeEventListener('touchmove', handleInteraction);
    window.removeEventListener('touchend', stopDragging);
    setIsDragging(false);
  }, [handleInteraction]);

  const startDragging = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    handleInteraction(e.nativeEvent); // Initial set on click
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleInteraction);
    window.addEventListener('touchend', stopDragging);
    setIsDragging(true);
  }, [handleInteraction, stopDragging]);
  
  useEffect(() => {
    // Cleanup listeners if component unmounts while dragging
    return () => stopDragging();
  }, [stopDragging]);


  const handleSubmit = () => {
    // In afternoon levels, we need to decide if 1 o'clock is 1 or 13.
    // A simple heuristic: if target is PM, and set hour is < 12, add 12.
    let submittedHour = displayHour;
    if (hour >= 13 && submittedHour < 12) {
        submittedHour += 12;
    }
    onSubmit(submittedHour, displayMinute);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-6">
      <p className="text-2xl font-semibold font-body">
        Réglez l'horloge sur <span className="font-bold font-numbers text-primary">{targetTime}</span>
      </p>
      
      <div 
        className="cursor-pointer"
        onMouseDown={startDragging}
        onTouchStart={startDragging}
      >
        <AnalogClock
            ref={clockRef}
            hour={displayHour}
            minute={displayMinute}
            showMinuteCircle={settings.showMinuteCircle}
            matchColors={settings.matchColors}
            coloredHands={settings.coloredHands}
        />
      </div>


      <Button
        size="lg"
        className={cn("w-full max-w-sm text-xl py-7",
            isCorrect === true ? "bg-green-500 hover:bg-green-600" : 
            isCorrect === false ? "bg-red-500 hover:bg-red-600" :
            "bg-accent text-accent-foreground hover:bg-accent/90"
        )}
        onClick={handleSubmit}
        disabled={isCorrect !== null}
      >
        <Check className="mr-2" />
        Valider
      </Button>
    </div>
  );
}
