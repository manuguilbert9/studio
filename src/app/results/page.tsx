
'use client';

import { useState, useEffect, useContext } from 'react';
import { skills, difficultyLevelToString } from '@/lib/skills';
import type { Skill } from '@/lib/skills';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ScoreTube } from '@/components/score-tube';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { UserContext } from '@/context/user-context';
import { getScoresForUser, Score } from '@/services/scores';


interface SkillScores {
  skill: Skill;
  scores: Score[];
  latestScore: Score | null;
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
            .sort((a, b) => {
                 // Ensure createdAt exists and is valid before comparing
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
          
          return {
            skill,
            scores: relatedScores,
            latestScore: relatedScores.length > 0 ? relatedScores[0] : null
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
      <div className="w-full max-w-5xl">
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
          <div className="w-[150px]"></div>
        </header>

        <main>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillScores.map(({ skill, latestScore, scores }) => (
                <Card key={skill.slug} className="flex flex-col items-center p-6 text-center">
                    <div className="text-primary [&>svg]:h-16 [&>svg]:w-16">
                        {skill.icon}
                    </div>
                    <CardTitle className="font-headline text-3xl mt-4 mb-2">{skill.name}</CardTitle>
                    {latestScore && latestScore.createdAt && (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Dernier exercice le {format(new Date(latestScore.createdAt), 'd MMMM yyyy', { locale: fr })}
                            </p>
                            <ScoreTube score={latestScore.score} />
                             <p className="text-lg mt-2">
                                Total exercices : <span className="font-bold">{scores.length}</span>
                            </p>
                             <Badge variant="secondary" className="mt-2">
                                {difficultyLevelToString(latestScore.skill, undefined, undefined, latestScore.timeSettings) || "Niveau Standard"}
                            </Badge>
                        </>
                    )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
