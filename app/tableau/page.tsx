'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PanelLeftOpen, Timer, CalendarDays, X, Maximize, Minimize } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { skills, getSkillBySlug, type Skill } from '@/lib/skills';
import { ExerciseWorkspace } from '@/components/exercise-workspace';
import { FluencyExercise } from '@/components/fluency-exercise';
import { TimerWidget } from '@/components/tableau/timer-widget';
import { DateWidget } from '@/components/tableau/date-widget';
import { AdditionWidget } from '@/components/tableau/addition-widget';
import { AdditionIcon } from '@/components/icons/addition-icon';

export default function TableauPage() {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  
  const [showTimer, setShowTimer] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showAddition, setShowAddition] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSelectSkill = (skill: Skill) => {
    setActiveSkill(skill);
    setDrawerOpen(false);
  };

  const renderExercise = () => {
    if (!activeSkill) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
          <h2 className="text-4xl font-headline">Bienvenue en mode tableau</h2>
          <p className="text-2xl mt-4">Veuillez sélectionner un exercice dans le panneau de gauche pour commencer.</p>
        </div>
      );
    }
    switch (activeSkill.slug) {
      case 'reading':
        return <FluencyExercise isTableauMode={true} />;
      default:
        return <ExerciseWorkspace skill={activeSkill} isTableauMode={true} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 relative flex flex-col">
       <header className="flex h-16 items-center justify-between border-b bg-slate-100/80 px-4 sm:px-6 backdrop-blur-sm z-20">
            <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <PanelLeftOpen className="h-5 w-5" />
                        <span className="sr-only">Ouvrir le tiroir des exercices</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    <SheetHeader>
                        <SheetTitle className="font-headline text-2xl">Choisir un exercice</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-2 mt-4">
                        {skills.map((skill) => (
                        <Button
                            key={skill.slug}
                            variant={activeSkill?.slug === skill.slug ? 'default' : 'ghost'}
                            className="justify-start text-lg h-12"
                            onClick={() => handleSelectSkill(skill)}
                        >
                            <span className="mr-4 text-primary">{skill.icon}</span>
                            {skill.name}
                        </Button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => setShowAddition(p => !p)}>
                    <AdditionIcon className="h-4 w-4 mr-2" /> Gabarit Addition
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setShowTimer(p => !p)}>
                    <Timer className="h-4 w-4 mr-2" /> Minuteur
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setShowDate(p => !p)}>
                    <CalendarDays className="h-4 w-4 mr-2" /> Date
                 </Button>
                 <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                    Plein écran
                 </Button>
            </div>
            
            <Button asChild variant="outline">
                <Link href="/">
                <Home className="h-4 w-4 mr-2" /> Quitter le mode tableau
                </Link>
            </Button>
       </header>

       <main className="flex-1 w-full p-4 sm:p-6 md:p-8">
            {renderExercise()}
       </main>

        {/* WIDGETS */}
        {showAddition && <AdditionWidget onClose={() => setShowAddition(false)} />}
        {showTimer && <TimerWidget onClose={() => setShowTimer(false)} />}
        {showDate && <DateWidget onClose={() => setShowDate(false)} />}
       
    </div>
  );
}
