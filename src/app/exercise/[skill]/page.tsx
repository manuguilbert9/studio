'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSkillBySlug } from '@/lib/skills';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseWorkspace } from '@/components/exercise-workspace';
import { FluencyExercise } from '@/components/fluency-exercise';
import { Button } from '@/components/ui/button';

export default function ExercisePage() {
  const params = useParams();
  const skillSlug = typeof params.skill === 'string' ? params.skill : '';
  const skill = getSkillBySlug(skillSlug);

  if (!skill) {
    notFound();
  }

  const renderExercise = () => {
    switch (skill.slug) {
      case 'reading':
        return <FluencyExercise />;
      default:
        return <ExerciseWorkspace skill={skill} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="relative flex items-center justify-between mb-8">
           <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux compétences
            </Link>
          </Button>
           <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link href="/" aria-label="Retour aux compétences">
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
