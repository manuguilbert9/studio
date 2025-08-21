
'use client';

import { useState, useEffect, useRef } from 'react';
import { getAvailableTexts, getTextContent } from '@/services/reading';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Play, Pause, RefreshCw, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";

interface SegResponse {
  original: string;
  segmented_text: string;
  words: string[];
}

async function syllabifyText(text: string): Promise<string | null> {
  try {
    // Direct call to the backend service routed by App Hosting
    const response = await fetch('/syllabify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sep: '.' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Syllabification API error:', errorText);
      // Try to parse error if it's JSON
      try {
        const errorJson = JSON.parse(errorText);
        return `Syllabification Error: ${errorJson.detail || errorText}`;
      } catch (e) {
        return `Syllabification Error: ${errorText}`;
      }
    }

    const data: SegResponse = await response.json();
    return data.segmented_text;
  } catch (error) {
    console.error('Failed to fetch syllabification API:', error);
    return 'Failed to connect to syllabification service.';
  }
}


export function FluencyExercise() {
  const { toast } = useToast();
  const [availableTexts, setAvailableTexts] = useState<Record<string, string[]>>({});
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [rawTextContent, setRawTextContent] = useState('');
  const [syllabifiedContent, setSyllabifiedContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyllabifying, setIsSyllabifying] = useState(false);

  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const [showSyllables, setShowSyllables] = useState(false);

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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);
  
  useEffect(() => {
    const performSyllabification = async () => {
        if (showSyllables && rawTextContent && !syllabifiedContent) {
          setIsSyllabifying(true);
          const result = await syllabifyText(rawTextContent);
          if (result && result.startsWith('Syllabification Error:')) {
              toast({
                variant: "destructive",
                title: "Erreur de syllabification",
                description: result,
              });
              setSyllabifiedContent(rawTextContent); // fallback to raw text
          } else if (result) {
              setSyllabifiedContent(result);
          } else {
              setSyllabifiedContent(rawTextContent); // fallback to raw text
          }
          setIsSyllabifying(false);
        }
    };
    performSyllabification();
  }, [showSyllables, rawTextContent, syllabifiedContent, toast]);

  const handleSelectLevel = (level: string) => {
    setSelectedLevel(level);
    setSelectedText('');
    setTitle('');
    setRawTextContent('');
    setSyllabifiedContent('');
    resetStopwatch();
  }

  const handleSelectText = async (filename: string) => {
    if (!filename || !selectedLevel) {
      setSelectedText('');
      setTitle('');
      setRawTextContent('');
      setSyllabifiedContent('');
      return;
    }
    setIsLoading(true);
    setSelectedText(filename);
    const content = await getTextContent(selectedLevel, filename);
    
    const titleMatch = content.match(/<titre>(.*?)<\/titre>/s);
    const newTitle = titleMatch ? titleMatch[1] : '';
    const newBody = content.replace(/<titre>.*?<\/titre>\s*/, '');
    
    setTitle(newTitle);
    setRawTextContent(newBody);
    setSyllabifiedContent(''); // Reset on new text
    setShowSyllables(false);
    resetStopwatch();
    setIsLoading(false);
  };

  const startStopwatch = () => setIsRunning(true);
  const stopStopwatch = () => setIsRunning(false);

  const resetStopwatch = () => {
    stopStopwatch();
    setTime(0);
    setWordCount(0);
    setShowResults(false);
    setErrors(0);
  };

  const handleTextClick = () => {
    if (!rawTextContent) return;

    if (!isRunning) {
        resetStopwatch();
        startStopwatch();
    } else {
        stopStopwatch();
        const words = rawTextContent.trim().split(/\s+/);
        setWordCount(words.length);
        setShowResults(true);
    }
  };
  
  const renderSyllabifiedText = (text: string) => {
    const elements: (string | JSX.Element)[] = [];
    // Split the text by spaces to process word by word, but keep separators
    const parts = text.split(/(\s+)/);
    let colorToggle = false;
  
    parts.forEach((part, partIndex) => {
      if (part.trim() === '') {
        // It's a space or multiple spaces, reset color toggle
        elements.push(<span key={`space-${partIndex}`}>{part}</span>);
        colorToggle = false;
      } else {
        // It's a word (potentially with punctuation)
        const syllables = part.split('.');
        syllables.forEach((syllable, sIndex) => {
          if (syllable) {
            const isLastCharSilent = syllable.endsWith('e') && sIndex === syllables.length - 1 && syllables.length > 1;
            const mainSyllable = isLastCharSilent ? syllable.slice(0, -1) : syllable;
            const silentE = isLastCharSilent ? syllable.slice(-1) : '';

            const className = `syllable-${colorToggle ? 'b' : 'a'}`;
            elements.push(
              <span key={`${partIndex}-${sIndex}`} className={className}>
                {mainSyllable}
                {silentE && <span className="letter-muette">{silentE}</span>}
              </span>
            );
            colorToggle = !colorToggle;
          }
        });
      }
    });
  
    return <>{elements}</>;
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
                  <SelectTrigger id="level-select" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Choisir..." />
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
                      <SelectTrigger id="text-select" className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Choisir..." />
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
            {/* Stopwatch Display and Controls */}
            <Card className="bg-muted/50 p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-2">
                        <Label htmlFor="syllable-switch" className="text-lg">Aide à la lecture</Label>
                        <Switch id="syllable-switch" checked={showSyllables} onCheckedChange={setShowSyllables} disabled={isSyllabifying} />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
                </div>
            </Card>

            {/* Text Content */}
            <Card>
                <CardHeader>
                    {title && <h3 className="text-2xl font-headline text-center">{title}</h3>}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2 p-6">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                    ) : isSyllabifying ? (
                         <div className="flex items-center justify-center p-10 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-lg text-muted-foreground">Colorisation en cours...</p>
                        </div>
                    ) : (
                      <div 
                        className="p-6 text-2xl leading-relaxed font-serif cursor-pointer"
                        onClick={handleTextClick}
                      >
                       {showSyllables && syllabifiedContent ? (
                          renderSyllabifiedText(syllabifiedContent)
                       ) : (
                          rawTextContent.split('\n').map((line, i) => <p key={i}>{line || <>&nbsp;</>}</p>)
                       )}
                      </div>
                    )}
                </CardContent>
                 <CardFooter className="text-sm text-muted-foreground">
                    Cliquez sur le texte pour démarrer ou arrêter le chrono.
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
