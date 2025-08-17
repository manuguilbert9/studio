import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSkillBySlug, skills } from '@/lib/skills';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseWorkspace } from '@/components/exercise-workspace';
import { Button } from '@/components/ui/button';

export async function generateStaticParams() {
  return skills.map((skill) => ({
    skill: skill.slug,
  }));
}

export default function ExercisePage({ params }: { params: { skill: string } }) {
  const skill = getSkillBySlug(params.skill);

  if (!skill) {
    notFound();
  }

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
          <ExerciseWorkspace skill={skill} />
        </main>
      </div>
    </div>
  );
}
