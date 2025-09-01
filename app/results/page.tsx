
'use client';

import { useState, useEffect, useContext } from 'react';
import { skills } from '@/lib/skills';
import type { Skill } from '@/lib/skills';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { UserContext } from '@/context/user-context';
import { getScoresForUser, Score } from '@/services/scores';
import { ScoreHistoryDisplay } from '@/components/score-history-chart';


interface SkillScores {
  skill: Skill;
  scores: Score[];
}


export default function ResultsPage() {
  const { student, isLoading: isUserLoading } = useContext(UserContext);
  const [skillScores, setSkillScores] = useState<SkillScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
    if (!student) {
        setIsLoading(false);
        return;
    };

    const fetchScores = async () => {
      setIsLoading(true);
      try {
        const userScores = await getScoresForUser(student.id);

        const scoresBySkill = skills.map(skill => {
          const relatedScores = userScores
            .filter(score => score.skill === skill.slug)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return {
            skill,
            scores: relatedScores,
          };
        }).filter(ss => ss.scores.length > 0); // Only show skills with at least one score

        setSkillScores(scoresBySkill);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [student, isUserLoading]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-6xl">
        <header className="relative flex items-center justify-between mb-8">
          <Button asChild variant="ghost">
            <Link href="/en-classe">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux exercices
            </Link>
          </Button>
          <h1 className="text-4xl font-headline text-center flex-grow">
            Mes Résultats
          </h1>
          <div className="w-auto sm:w-[190px]"></div>
        </header>

        <main className="space-y-8">
          {isLoading || isUserLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          ) : !student ? (
            <Card className="text-center p-8">
              <CardTitle>Aucun élève connecté</CardTitle>
              <CardDescription className="mt-2">Veuillez vous connecter pour voir vos résultats.</CardDescription>
               <Button asChild className="mt-4">
                <Link href="/">Se connecter</Link>
              </Button>
            </Card>
          ) : skillScores.length === 0 ? (
            <Card className="text-center p-8">
              <CardTitle>Aucun résultat pour le moment</CardTitle>
              <CardDescription className="mt-2">Commencez un exercice pour voir votre progression ici !</CardDescription>
            </Card>
          ) : (
            <>
              {skillScores.map(({ skill, scores }) => (
                <Card key={skill.slug} className="flex flex-col p-6">
                    <div className='flex items-center gap-4'>
                        <div className="text-primary [&>svg]:h-16 [&>svg]:w-16">
                            {skill.icon}
                        </div>
                        <CardTitle className="font-headline text-3xl">{skill.name}</CardTitle>
                    </div>
                    <ScoreHistoryDisplay scoreHistory={scores} />
                </Card>
              ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
