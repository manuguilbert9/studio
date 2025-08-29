

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PanelLeftOpen, Timer, CalendarDays, X, Maximize, Minimize, Type, Save, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { skills, getSkillBySlug, type Skill } from '@/lib/skills';
import { ExerciseWorkspace } from '@/components/exercise-workspace';
import { FluencyExercise } from '@/components/fluency-exercise';
import { TimerWidget } from '@/components/tableau/timer-widget';
import { DateWidget } from '@/components/tableau/date-widget';
import { AdditionWidget } from '@/components/tableau/addition-widget';
import { SoustractionWidget } from '@/components/tableau/soustraction-widget';
import { TextWidget } from '@/components/tableau/text-widget';
import { ImageWidget } from '@/components/tableau/image-widget';
import { CalculWidgetSelect } from '@/components/tableau/calcul-widget-select';
import { cn } from '@/lib/utils';
import { saveTableauState, loadTableauState } from '@/services/tableau';
import type { TableauState, TextWidgetState, DateWidgetState, TimerWidgetState, AdditionWidgetState, ImageWidgetState, SoustractionWidgetState } from '@/services/tableau.types';


type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const defaultTableauState: Omit<TableauState, 'updatedAt'> = {
    activeSkillSlug: null,
    textWidgets: [],
    dateWidgets: [],
    timerWidgets: [],
    additionWidgets: [],
    soustractionWidgets: [],
    imageWidgets: [],
};

export default function TableauPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  
  // WIDGETS STATE
  const [textWidgets, setTextWidgets] = useState<TextWidgetState[]>([]);
  const [dateWidgets, setDateWidgets] = useState<DateWidgetState[]>([]);
  const [timerWidgets, setTimerWidgets] = useState<TimerWidgetState[]>([]);
  const [additionWidgets, setAdditionWidgets] = useState<AdditionWidgetState[]>([]);
  const [soustractionWidgets, setSoustractionWidgets] = useState<SoustractionWidgetState[]>([]);
  const [imageWidgets, setImageWidgets] = useState<ImageWidgetState[]>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 200, y: 150 });
  
  useEffect(() => {
    const storedName = localStorage.getItem('skillfiesta_username');
    if (storedName) {
      setUsername(storedName);
    } else {
      setIsLoading(false);
    }

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleMouseMove = (e: MouseEvent) => setLastMousePos({ x: e.clientX, y: e.clientY });

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (!blob) continue;

            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src) {
                    const newImageWidget: ImageWidgetState = {
                        id: Date.now(),
                        pos: { x: lastMousePos.x - 150, y: lastMousePos.y - 100 },
                        size: { width: 300, height: 200 },
                        src,
                    };
                    setImageWidgets(current => [...current, newImageWidget]);
                }
            };
            reader.readAsDataURL(blob);
            event.preventDefault(); // Prevent the default paste action
            break; // Handle only the first image found
        }
    }
  }, [lastMousePos]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Load state from file
  useEffect(() => {
    if (!username) return;

    const fetchState = async () => {
        setIsLoading(true);
        try {
            const loadedState = await loadTableauState(username);
            if (loadedState) {
                setActiveSkill(getSkillBySlug(loadedState.activeSkillSlug || ''));
                setTextWidgets(loadedState.textWidgets || []);
                setDateWidgets(loadedState.dateWidgets || []);
                setTimerWidgets(loadedState.timerWidgets || []);
                setAdditionWidgets(loadedState.additionWidgets || []);
                setSoustractionWidgets(loadedState.soustractionWidgets || []);
                setImageWidgets(loadedState.imageWidgets || []);
            } else {
                // Initialize with default state if nothing is loaded
                setActiveSkill(null);
                setTextWidgets(defaultTableauState.textWidgets);
                setDateWidgets(defaultTableauState.dateWidgets);
                setTimerWidgets(defaultTableauState.timerWidgets);
                setAdditionWidgets(defaultTableauState.additionWidgets);
                setSoustractionWidgets(defaultTableauState.soustractionWidgets);
                setImageWidgets(defaultTableauState.imageWidgets);
            }
        } catch (error) {
            console.error("Error loading state, initializing with default:", error);
             // Initialize with default state on error
             setActiveSkill(null);
             setTextWidgets(defaultTableauState.textWidgets);
             setDateWidgets(defaultTableauState.dateWidgets);
             setTimerWidgets(defaultTableauState.timerWidgets);
             setAdditionWidgets(defaultTableauState.additionWidgets);
             setSoustractionWidgets(defaultTableauState.soustractionWidgets);
             setImageWidgets(defaultTableauState.imageWidgets);
        } finally {
            setIsLoading(false);
        }
    };
    fetchState();
  }, [username]);

  const handleSaveState = useCallback(async () => {
    if (!username) return;
    setSaveStatus('saving');
    
    const currentState: Omit<TableauState, 'updatedAt'> = {
        activeSkillSlug: activeSkill?.slug || null,
        textWidgets,
        dateWidgets,
        timerWidgets,
        additionWidgets,
        soustractionWidgets,
        imageWidgets,
    };

    const result = await saveTableauState(username, currentState);

    if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
        setSaveStatus('error');
        console.error("Failed to save:", result.error);
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [username, activeSkill, textWidgets, dateWidgets, timerWidgets, additionWidgets, soustractionWidgets, imageWidgets]);


  // Widget handlers
  const addWidget = <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, newState: T) => {
    setter(current => [...current, newState]);
  };
  const removeWidget = <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, idToRemove: number) => {
    setter(current => current.filter(widget => widget.id !== idToRemove));
  };
  const updateWidget = <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, updatedState: T) => {
    setter(current => current.map(widget => widget.id === updatedState.id ? updatedState : widget));
  };

  const handleAddTextWidget = () => {
    addWidget(setTextWidgets, { id: Date.now(), pos: { x: lastMousePos.x, y: lastMousePos.y }, size: { width: 300, height: 200 }, text: '', fontSize: 16, color: 'text-slate-900', isUnderlined: false });
  };

  const handleAddDateWidget = () => {
    addWidget(setDateWidgets, { id: Date.now(), pos: { x: lastMousePos.x, y: lastMousePos.y }, size: { width: 450, height: 70 }, dateFormat: 'long' });
  };
  
  const handleAddTimerWidget = () => {
    addWidget(setTimerWidgets, { id: Date.now(), pos: { x: lastMousePos.x, y: lastMousePos.y }, size: { width: 400, height: 120 } });
  };

  const handleAddAdditionWidget = () => {
    addWidget(setAdditionWidgets, { id: Date.now(), pos: { x: lastMousePos.x, y: lastMousePos.y }, size: { width: 450, height: 300 }, numOperands: 2, numCols: 3 });
  };
  
  const handleAddSoustractionWidget = () => {
    addWidget(setSoustractionWidgets, { id: Date.now(), pos: { x: lastMousePos.x, y: lastMousePos.y }, size: { width: 450, height: 300 }, numCols: 3 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
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

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 relative flex flex-col">
       
       <div className="group fixed top-0 left-0 right-0 z-20">
            <div className="h-8 w-full bg-transparent"></div>
            <header className={cn("absolute top-0 left-0 right-0 z-20 transition-transform duration-300 ease-in-out -translate-y-full group-hover:translate-y-0")}>
                <div className="flex h-16 items-center justify-between border-b bg-slate-100/80 px-4 sm:px-6 backdrop-blur-sm shadow-md">
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
                            <Button variant="outline" size="sm" disabled>
                                <ImageIcon className="h-4 w-4 mr-2" /> Coller une image (Ctrl+V)
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleAddTextWidget}>
                                <Type className="h-4 w-4 mr-2" /> Texte
                            </Button>
                            
                            <CalculWidgetSelect 
                                onAddAddition={handleAddAdditionWidget}
                                onAddSoustraction={handleAddSoustractionWidget}
                            />

                            <Button variant="outline" size="sm" onClick={handleAddTimerWidget}>
                                <Timer className="h-4 w-4 mr-2" /> Minuteur
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleAddDateWidget}>
                                <CalendarDays className="h-4 w-4 mr-2" /> Date
                            </Button>
                             <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                                {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />} Plein écran
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" onClick={handleSaveState} disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
                                {saveStatus === 'saving' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {saveStatus === 'saved' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                                {saveStatus === 'error' && <X className="h-4 w-4 mr-2 text-red-500" />}
                                {saveStatus === 'idle' && <Save className="h-4 w-4 mr-2" />}
                                {saveStatus === 'saving' ? 'Enregistrement...' : saveStatus === 'saved' ? 'Enregistré' : 'Sauvegarder'}
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/">
                                <Home className="h-4 w-4 mr-2" /> Quitter
                                </Link>
                            </Button>
                        </div>
                </div>
            </header>
        </div>


       <main className="flex-1 w-full p-4 sm:p-6 md:p-8 pt-12">
            {renderExercise()}
       </main>

        {/* WIDGETS */}
        {imageWidgets.map(widgetState => (
          <ImageWidget key={widgetState.id} initialState={widgetState} onUpdate={updateWidget.bind(null, setImageWidgets)} onClose={() => removeWidget(setImageWidgets, widgetState.id)} />
        ))}
        {textWidgets.map(widgetState => (
          <TextWidget key={widgetState.id} initialState={widgetState} onUpdate={updateWidget.bind(null, setTextWidgets)} onClose={() => removeWidget(setTextWidgets, widgetState.id)} />
        ))}
        {additionWidgets.map(widgetState => (
            <AdditionWidget key={widgetState.id} initialState={widgetState} onUpdate={updateWidget.bind(null, setAdditionWidgets)} onClose={() => removeWidget(setAdditionWidgets, widgetState.id)} />
        ))}
        {soustractionWidgets.map(widgetState => (
            <SoustractionWidget key={widgetState.id} initialState={widgetState} onUpdate={updateWidget.bind(null, setSoustractionWidgets)} onClose={() => removeWidget(setSoustractionWidgets, widgetState.id)} />
        ))}
        {timerWidgets.map(widgetState => (
            <TimerWidget key={widgetState.id} initialState={widgetState} onUpdate={updateWidget.bind(null, setTimerWidgets)} onClose={() => removeWidget(setTimerWidgets, widgetState.id)} />
        ))}
        {dateWidgets.map(widgetState => (
            <DateWidget key={widgetState.id} initialState={widgetState} onUpdate={updateWidget.bind(null, setDateWidgets)} onClose={() => removeWidget(dateWidgets, widgetState.id)} />
        ))}
       
    </div>
  );
}

    
