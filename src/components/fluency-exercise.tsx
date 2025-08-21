
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getAvailableTexts, getTextContent } from '@/services/reading';
import { segmentText, type Options, type ModeAlgo, type TypeSyllabes } from '@/lib/syllabify';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Play, Pause, RefreshCw, BrainCircuit, Settings } from 'lucide-react';
import { Switch } from './ui/switch';
import { Skeleton } from './ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';

type RenderMode = "colors" | "underline";

export function FluencyExercise() {
  const [availableTexts, setAvailableTexts] = useState<Record<string, string[]>>({});
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState<string>('');
  const [syllabifiedContent, setSyllabifiedContent] = useState<React.ReactNode>(null);
  
  const [useSyllableHelp, setUseSyllableHelp] = useState(false);
  const [isSyllabifying, setIsSyllabifying] = useState(false);

  const [syllabifyOptions, setSyllabifyOptions] = useState<Options>({
    modeAlgo: 'LC',
    typeSyllabes: 'ECRITES',
    lecteurDebutant: false,
  });
  const [renderMode, setRenderMode] = useState<RenderMode>('colors');

  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchTexts() {
      const texts = await getAvailableTexts();
      setAvailableTexts(texts);
    }
    fetchTexts();
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleSelectLevel = (level: string) => {
    setSelectedLevel(level);
    setSelectedText('');
    setTextContent('');
    setTitle('');
    resetStopwatch();
  }

  const handleSelectText = async (filename: string) => {
    if (!filename || !selectedLevel) {
      setSelectedText('');
      setTextContent('');
      setTitle('');
      return;
    }
    setSelectedText(filename);
    const content = await getTextContent(selectedLevel, filename);
    
    const titleMatch = content.match(/<titre>(.*?)<\/titre>/s);
    const newTitle = titleMatch ? titleMatch[1] : '';
    const newBody = content.replace(/<titre>.*?<\/titre>\s*/, '');
    
    setTitle(newTitle);
    setTextContent(newBody);
    resetStopwatch();
  };

 useEffect(() => {
    if (useSyllableHelp && textContent) {
      setIsSyllabifying(true);
      
      const segmented = segmentText(textContent, syllabifyOptions);
      
      const rendered = segmented.map((token, index) => {
        if (typeof token === 'string') {
          return <span key={index}>{token}</span>;
        }
        
        // C'est un mot syllabifié (string[])
        return (
          <span key={index}>
            {token.map((syllable, sIndex) => {
              const baseClass = sIndex % 2 === 0 ? 'a' : 'b';
              const className = renderMode === 'colors' 
                ? `syllable-${baseClass}`
                : `syllable-underline-${baseClass}`;
              return <span key={sIndex} className={className}>{syllable}</span>;
            })}
          </span>
        );
      });

      setSyllabifiedContent(<>{rendered}</>);
      setIsSyllabifying(false);
    } else {
      setSyllabifiedContent(null);
    }
  }, [useSyllableHelp, textContent, syllabifyOptions, renderMode]);


  const startStopwatch = () => setIsRunning(true);
  const stopStopwatch = () => setIsRunning(false);

  const resetStopwatch = () => {
    stopStopwatch();
    setTime(0);
    setWordCount(0);
    setShowResults(false);
    setErrors(0);
  };

  const handleWordClick = (wordIndex: number) => {
    if (!isRunning && wordIndex === 0) {
      resetStopwatch();
      startStopwatch();
      setWordCount(1); // Start with the first word
    } else if (isRunning) {
      stopStopwatch();
      const words = textContent.trim().split(/\s+/);
      setWordCount(Math.min(words.length, wordIndex + 1));
      setShowResults(true);
    }
  };

  const wpm = wordCount > 0 && time > 0 ? Math.round((wordCount / time) * 60) : 0;
  const netWpm = wpm > 0 ? Math.max(0, wpm - errors) : 0;

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Exercice de Fluence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <Label htmlFor="level-select" className="text-lg">Niveau :</Label>
                <Select onValueChange={handleSelectLevel} value={selectedLevel}>
                  <SelectTrigger id="level-select" className="w-full">
                    <SelectValue placeholder="Choisir un niveau..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(availableTexts).map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
             {selectedLevel && (
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Label htmlFor="text-select" className="text-lg">Texte :</Label>
                    <Select onValueChange={handleSelectText} value={selectedText} disabled={!selectedLevel}>
                      <SelectTrigger id="text-select" className="w-full">
                        <SelectValue placeholder="Choisir un texte..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTexts[selectedLevel]?.map(text => (
                          <SelectItem key={text} value={text}>{text.replace('.txt', '')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        
        {selectedText && (
          <>
            <div className="flex justify-end">
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="syllable-help" 
                        checked={useSyllableHelp}
                        onCheckedChange={setUseSyllableHelp}
                    />
                    <Label htmlFor="syllable-help" className="flex items-center gap-2 text-lg">
                        <BrainCircuit className="text-primary"/> Aide syllabique
                    </Label>
                </div>
            </div>

            <Collapsible disabled={!useSyllableHelp}>
              <CollapsibleTrigger asChild>
                  <Button variant="outline" className={cn("w-full", !useSyllableHelp && "hidden")}>
                      <Settings className="mr-2"/> Options de syllabification
                  </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                  <Card className="p-4 mt-2 space-y-4 bg-muted/50">
                      <div className="flex items-center justify-between">
                           <Label htmlFor="debutant-switch" className="text-base font-medium">Lecteur débutant</Label>
                           <Switch
                              id="debutant-switch"
                              checked={syllabifyOptions.lecteurDebutant}
                              onCheckedChange={(checked) => setSyllabifyOptions(o => ({...o, lecteurDebutant: checked}))}
                           />
                      </div>
                      
                      <div>
                          <Label className="text-base font-medium">Gestion des consonnes doubles</Label>
                          <RadioGroup 
                              value={syllabifyOptions.modeAlgo}
                              onValueChange={(value: ModeAlgo) => setSyllabifyOptions(o => ({...o, modeAlgo: value}))}
                              className="flex gap-4 mt-2"
                          >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="STD" id="mode-std" />
                                <Label htmlFor="mode-std">Standard (ex: al-ler)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="LC" id="mode-lc" />
                                <Label htmlFor="mode-lc">"Legato" (ex: a-ller)</Label>
                              </div>
                          </RadioGroup>
                      </div>

                       <div>
                          <Label className="text-base font-medium">Type de syllabes</Label>
                           <RadioGroup 
                              value={syllabifyOptions.typeSyllabes}
                              onValueChange={(value: TypeSyllabes) => setSyllabifyOptions(o => ({...o, typeSyllabes: value}))}
                              className="flex gap-4 mt-2"
                          >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ECRITES" id="type-ecrites" />
                                <Label htmlFor="type-ecrites">Écrites (conserve les 'e' muets)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ORALES" id="type-orales" />
                                <Label htmlFor="type-orales">Orales (supprime les 'e' muets)</Label>
                              </div>
                          </RadioGroup>
                      </div>

                       <div>
                          <Label className="text-base font-medium">Mode de rendu</Label>
                           <RadioGroup 
                              value={renderMode}
                              onValueChange={(value: RenderMode) => setRenderMode(value)}
                              className="flex gap-4 mt-2"
                          >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="colors" id="render-colors" />
                                <Label htmlFor="render-colors">Couleurs</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="underline" id="render-underline" />
                                <Label htmlFor="render-underline">Soulignement</Label>
                              </div>
                          </RadioGroup>
                      </div>

                  </Card>
              </CollapsibleContent>
            </Collapsible>


            {/* Stopwatch Display and Controls */}
            <Card className="bg-muted/50 p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Chronomètre</p>
                        <p className="font-mono text-5xl font-bold text-primary">
                          <span>{("0" + Math.floor(time / 60)).slice(-2)}:</span>
                          <span>{("0" + (time % 60)).slice(-2)}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={startStopwatch} disabled={isRunning} aria-label="Démarrer">
                            <Play className="mr-2"/> Démarrer
                        </Button>
                        <Button onClick={stopStopwatch} disabled={!isRunning} variant="destructive" aria-label="Arrêter">
                            <Pause className="mr-2"/> Arrêter
                        </Button>
                        <Button onClick={resetStopwatch} variant="outline" aria-label="Réinitialiser">
                            <RefreshCw/>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Text Content */}
            <Card>
                <CardHeader>
                    {title && <h3 className="text-2xl font-headline text-center">{title}</h3>}
                </CardHeader>
                <CardContent>
                    {isSyllabifying ? (
                        <div className="space-y-2 p-6">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                    ) : (
                      <p className="p-6 text-2xl leading-relaxed font-serif">
                        {useSyllableHelp ? syllabifiedContent : (
                          textContent.split(/(\s+)/).map((segment, index) => {
                            if (/\s+/.test(segment)) {
                              return <span key={index}>{segment}</span>;
                            }
                            const wordIndex = Math.floor(index / 2);
                            return (
                              <span
                                key={index}
                                onClick={() => handleWordClick(wordIndex)}
                                className="cursor-pointer hover:bg-primary/20 rounded-md p-1 transition-colors"
                              >
                                {segment}
                              </span>
                            );
                          })
                        )}
                      </p>
                    )}
                </CardContent>
                 <CardFooter className="text-sm text-muted-foreground">
                    Cliquez sur le premier mot pour démarrer le chrono. Cliquez sur le dernier mot lu pour l'arrêter.
                </CardFooter>
            </Card>

            {/* Results Display */}
            {showResults && (
              <Card className="bg-secondary/50 p-6">
                <CardTitle className="text-2xl mb-4 text-center">Résultats de la lecture</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                   <div className="bg-card p-4 rounded-lg">
                        <p className="text-sm font-semibold text-muted-foreground">Temps écoulé</p>
                        <p className="text-3xl font-bold">{time}s</p>
                    </div>
                     <div className="bg-card p-4 rounded-lg">
                        <p className="text-sm font-semibold text-muted-foreground">Mots lus</p>
                        <p className="text-3xl font-bold">{wordCount}</p>
                    </div>
                     <div className="bg-card p-4 rounded-lg">
                        <p className="text-sm font-semibold text-muted-foreground">Mots par minute (brut)</p>
                        <p className="text-3xl font-bold">{wpm}</p>
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                    <Label htmlFor="errors" className="text-lg whitespace-nowrap">Entrez le nombre d'erreurs :</Label>
                    <Input 
                        id="errors" 
                        type="number" 
                        value={errors}
                        onChange={(e) => setErrors(Number(e.target.value))}
                        className="w-full sm:w-32 text-lg h-12"
                    />
                     <div className="flex-grow bg-card p-4 rounded-lg text-center">
                        <p className="text-sm font-semibold text-muted-foreground">Mots par minute (corrigé)</p>
                        <p className="text-3xl font-bold text-primary">{netWpm}</p>
                    </div>
                </div>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
