

'use client';

import Link from 'next/link';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSkillBySlug } from '@/lib/skills';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseWorkspace } from '@/components/exercise-workspace';
import { Button } from '@/components/ui/button';
import { LongCalculationExercise } from '@/components/long-calculation-exercise';
import { WordFamiliesExercise } from '@/components/word-families-exercise';
import { MentalCalculationExercise } from '@/components/mental-calculation-exercise';
import { CalendarExercise } from '@/components/calendar-exercise';
import { ReadingRaceExercise } from '@/components/reading-race-exercise';
import { SimpleWordReadingExercise } from '@/components/simple-word-reading-exercise';
import { WritingNotebook } from '@/components/writing-notebook';
import { KeyboardCopyExercise } from '@/components/keyboard-copy-exercise';
import { SommeDixExercise } from '@/components/somme-dix-exercise';
import { LetterRecognitionExercise } from '@/components/letter-recognition-exercise';
import { ReadingDirectionExercise } from '@/components/reading-direction-exercise';
import { ComplementDixExercise } from '@/components/complement-dix-exercise';
import { SonAnExercise } from '@/components/son-an-exercise';
import { NombresComplexesExercise } from '@/components/nombres-complexes-exercise';
import { LettresEtSonsExercise } from '@/components/lettres-et-sons-exercise';
import { DictationExercise } from '@/components/dictation-exercise';

export default function ExercisePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const skillSlug = typeof params.skill === 'string' ? params.skill : '';
  const from = searchParams.get('from');

  const skill = getSkillBySlug(skillSlug);

  if (!skill) {
    notFound();
  }
  
  const returnHref = from === 'devoirs' ? '/devoirs' : '/en-classe';

  const renderExercise = () => {
    switch (skill.slug) {
      case 'somme-dix':
        return <SommeDixExercise />;
      case 'long-calculation':
        return <LongCalculationExercise />;
      case 'word-families':
        return <WordFamiliesExercise />;
      case 'mental-calculation':
        return <MentalCalculationExercise />;
      case 'calendar':
        return <CalendarExercise />;
      case 'reading-race':
        return <ReadingRaceExercise />;
      case 'simple-word-reading':
        return <SimpleWordReadingExercise />;
      case 'writing-notebook':
        return <WritingNotebook />;
      case 'keyboard-copy':
        return <KeyboardCopyExercise />;
      case 'letter-recognition':
        return <LetterRecognitionExercise />;
      case 'reading-direction':
        return <ReadingDirectionExercise />;
      case 'complement-dix':
        return <ComplementDixExercise />;
      case 'son-an':
        return <SonAnExercise />;
      case 'nombres-complexes':
        return <NombresComplexesExercise />;
      case 'lettres-et-sons':
        return <LettresEtSonsExercise />;
      case 'dictee':
        return <DictationExercise />;
      case 'denombrement':
      case 'time':
      case 'lire-les-nombres':
      case 'ecoute-les-nombres':
      case 'syllabe-attaque':
      default:
        return <ExerciseWorkspace skill={skill} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="relative flex items-center justify-between mb-8">
           <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={returnHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
           <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link href={returnHref} aria-label="Retour">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Card className="flex-grow mx-4 sm:mx-8">
            <CardHeader className="flex flex-row items-center justify-center space-x-4 p-4">
              <div className="text-primary [&>svg]:h-12 [&>svg]:w-12">{skill.icon}</div>
              <CardTitle className="font-headline text-4xl">{skill.name}</CardTitle>
            </CardHeader>
          </Card>
          <div className="w-10 sm:w-[150px]"></div>
        </header>

        <main>
          {renderExercise()}
        </main>
      </div>
    </div>
  );
}
