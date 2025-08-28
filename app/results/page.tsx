'use client';

import { useState, useEffect } from 'react';
import { skills, difficultyLevelToString } from '@/lib/skills';
import type { Skill } from '@/lib/skills';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ScoreTube } from '@/components/score-tube';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CalculationSettings, CurrencySettings, TimeSettings } from '@/lib/questions';
import { Badge } from '@/components/ui/badge';

// Note: This data would typically come from a database.
// For this example, we'll simulate fetching it.
const MOCK_SCORES_DB = 'MOCK_SCORES_DB';

interface Score {
  userId: string;
  skill: string;
  score: number;
  createdAt: string; // Using ISO string for simplicity
  calculationSettings?: CalculationSettings;
  currencySettings?: CurrencySettings;
  timeSettings?: TimeSettings;
}

interface SkillScores {
  skill: Skill;
  scores: Score[];
  latestScore: Score | null;
}

// Helper to get all scores from localStorage
const getAllScores = (): Score[] => {
    if (typeof window === 'undefined') return [];
    try {
        const scores = localStorage.getItem(MOCK_SCORES_DB);
        return scores ? JSON.parse(scores) : [];
    } catch (error) {
        console.error("Failed to parse scores from localStorage", error);
        return [];
    }
};

export default function ResultsPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [skillScores, setSkillScores] = useState<SkillScores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem('skillfiesta_username');
    if (storedName) {
      setUsername(storedName);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!username) {
        if (!isLoading) setIsLoading(false);
        return;
    };

    const fetchScores = () => {
      setIsLoading(true);
      try {
        const allScores = getAllScores();
        const userScores = allScores.filter(score => score.userId === username);

        const scoresBySkill = skills.map(skill => {
          const relatedScores = userScores
            .filter(score => score.skill === skill.slug)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return {
            skill,
            scores: relatedScores,
            latestScore: relatedScores.length > 0 ? relatedScores[0] : null
          };
        }).filter(ss => ss.latestScore); // Only show skills with at least one score

        setSkillScores(scoresBySkill);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [username, isLoading]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <header className="relative flex items-center justify-between mb-8">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <h1 className="text-4xl font-headline text-center flex-grow">
            Mes Résultats
          </h1>
          <div className="w-[150px]"></div>
        </header>

        <main>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          ) : !username ? (
            <Card className="text-center p-8">
              <CardTitle>Aucun utilisateur connecté</CardTitle>
              <CardDescription className="mt-2">Veuillez vous connecter pour voir vos résultats.</CardDescription>
            </Card>
          ) : skillScores.length === 0 ? (
            <Card className="text-center p-8">
              <CardTitle>Aucun résultat pour le moment</CardTitle>
              <CardDescription className="mt-2">Commencez un exercice pour voir votre progression ici !</CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillScores.map(({ skill, latestScore }) => (
                <Card key={skill.slug} className="flex flex-col items-center p-6 text-center">
                    <div className="text-primary [&>svg]:h-16 [&>svg]:w-16">
                        {skill.icon}
                    </div>
                    <CardTitle className="font-headline text-3xl mt-4 mb-2">{skill.name}</CardTitle>
                    {latestScore && (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Dernier exercice le {format(new Date(latestScore.createdAt), 'd MMMM yyyy', { locale: fr })}
                            </p>
                            <ScoreTube score={latestScore.score} />
                             <p className="text-lg mt-2">
                                Total exercices : <span className="font-bold">{skillScores.find(s => s.skill.slug === skill.slug)?.scores.length}</span>
                            </p>
                             <Badge variant="secondary" className="mt-2">
                                {difficultyLevelToString(latestScore.skill, latestScore.calculationSettings, latestScore.currencySettings, latestScore.timeSettings) || "Niveau Standard"}
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
