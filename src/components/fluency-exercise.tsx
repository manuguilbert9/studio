'use client';

import { useState, useEffect, useRef } from 'react';
import { getAvailableTexts, getTextContent } from '@/services/reading';
import { syllabifyText } from '@/ai/flows/syllabify-text-flow';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Play, Pause, RefreshCw, Flag, Loader2 } from 'lucide-react';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

interface SyllabifiedWord {
  original: string;
  syllables: string[];
}

export function FluencyExercise() {
  const [availableTexts, setAvailableTexts] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [textContent, setTextContent] = useState<string[]>([]);
  const [syllabifiedContent, setSyllabifiedContent] = useState<SyllabifiedWord[]>([]);
  const [useSyllables, setUseSyllables] = useState(false);
  const [isSyllabifying, setIsSyllabifying] = useState(false);

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

  const handleSelectText = async (filename: string) => {
    if (!filename) {
      setSelectedText('');
      setTextContent([]);
      setSyllabifiedContent([]);
      return;
    }
    setSelectedText(filename);
    const content = await getTextContent(filename);
    const words = content.split(/\s+/).filter(Boolean);
    setTextContent(words);
    
    if (useSyllables) {
      handleSyllabification(words);
    } else {
      setSyllabifiedContent([]);
    }
    resetStopwatch();
  };

  const handleSyllabification = async (words: string[]) => {
      if (!words.length) return;
      setIsSyllabifying(true);
      try {
        const fullText = words.join(' ');
        const resultHtml = await syllabifyText(fullText);
        
        // This is a simplified parser. It might not handle all edge cases.
        const parsedWords: SyllabifiedWord[] = resultHtml.split(' ').map(wordHtml => {
            const original = wordHtml.replace(/<[^>]+>/g, '');
            const syllableSpans = Array.from(wordHtml.matchAll(/<span class="syllable-[ab]">(.*?)<\/span>/g));
            const syllables = syllableSpans.map(match => match[1]);
            return { original, syllables };
        });
        setSyllabifiedContent(parsedWords);
      } catch (error) {
        console.error("Failed to syllabify text:", error);
        // Fallback to non-syllabified text if AI fails
        setUseSyllables(false);
        setSyllabifiedContent([]);
      } finally {
        setIsSyllabifying(false);
      }
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

  const handleWordClick = (wordIndex: number) => {
    if (wordIndex === 0) {
      resetStopwatch();
      startStopwatch();
      setWordCount(1); // Start counting from the first word
    } else {
      stopStopwatch();
      setWordCount(wordIndex + 1);
      setShowResults(true);
    }
  };

  const handleSyllableClick = (wordIndex: number) => {
     // The logic is the same as clicking a word for now.
     handleWordClick(wordIndex);
  }

  const handleToggleSyllables = (checked: boolean) => {
    setUseSyllables(checked);
    if (checked && textContent.length > 0) {
        handleSyllabification(textContent);
    } else {
        setSyllabifiedContent([]);
    }
  }
  
  const wpm = wordCount > 0 && time > 0 ? Math.round((wordCount / time) * 60) : 0;
  const netWpm = wpm > 0 ? Math.max(0, wpm - errors) : 0;

  const renderTextContent = () => {
    if (isSyllabifying) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Segmentation en cours...</p>
            </div>
        );
    }
    
    if (useSyllables && syllabifiedContent.length > 0) {
        return (
             <p className="p-6 text-2xl leading-relaxed font-serif">
                {syllabifiedContent.map((word, wordIndex) => (
                    <span key={wordIndex} className="inline-block mr-3" onClick={() => handleSyllableClick(wordIndex)}>
                        {word.syllables.map((syllable, syllableIndex) => (
                             <span
                                key={syllableIndex}
                                className={`cursor-pointer hover:bg-yellow-200 rounded-sm p-0.5 transition-colors ${syllableIndex % 2 === 0 ? 'syllable-b' : 'syllable-a'}`}
                            >
                                {syllable}
                            </span>
                        ))}
                    </span>
                ))}
             </p>
        );
    }

    return (
        <p className="p-6 text-2xl leading-relaxed font-serif">
            {textContent.map((word, index) => (
                <span
                    key={index}
                    onClick={() => handleWordClick(index)}
                    className="cursor-pointer hover:bg-yellow-200 rounded-md p-1 transition-colors"
                >
                    {word}{' '}
                </span>
            ))}
        </p>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-center">Exercice de Fluence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label htmlFor="text-select" className="text-lg">Choisis un texte :</Label>
            <Select onValueChange={handleSelectText} value={selectedText}>
              <SelectTrigger id="text-select" className="w-full sm:w-[300px]">
                <SelectValue placeholder="Sélectionner un texte..." />
              </SelectTrigger>
              <SelectContent>
                {availableTexts.map(text => (
                  <SelectItem key={text} value={text}>{text.replace('.txt', '')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
                <Switch id="syllable-mode" checked={useSyllables} onCheckedChange={handleToggleSyllables} />
                <Label htmlFor="syllable-mode">Aide syllabique</Label>
                <Badge variant="destructive">BETA</Badge>
            </div>
        </div>
        
        {selectedText && (
          <>
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
                <CardContent className="p-0">
                    {renderTextContent()}
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
