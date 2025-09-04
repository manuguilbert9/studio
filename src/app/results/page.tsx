
'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { UserContext } from '@/context/user-context';
import { Score, getScoresForUser } from '@/services/scores';
import { getSkillBySlug } from '@/lib/skills';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Loader2 } from 'lucide-react';
import { ErlenmeyerFlask } from '@/components/erlenmeyer-flask';
import { Logo } from '@/components/logo';

interface SkillAverage {
    slug: string;
    name: string;
    icon: React.ReactElement;
    average: number;
    count: number;
}

export default function ResultsPage() {
    const { student, isLoading: isUserLoading } = useContext(UserContext);
    const [averages, setAverages] = useState<SkillAverage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAndCalculateScores() {
            if (!student) {
                if (!isUserLoading) setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const allScores = await getScoresForUser(student.id);

            const scoresBySkill: Record<string, Score[]> = {};
            // Group scores by skill
            allScores.forEach(score => {
                if (!scoresBySkill[score.skill]) {
                    scoresBySkill[score.skill] = [];
                }
                scoresBySkill[score.skill].push(score);
            });

            const calculatedAverages: SkillAverage[] = [];
            // Calculate average for each skill group
            for (const skillSlug in scoresBySkill) {
                const skillInfo = getSkillBySlug(skillSlug);
                if (skillInfo) {
                    const skillScores = scoresBySkill[skillSlug];
                    
                    // Sort by date and take the last 10 scores
                    const last10Scores = skillScores
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 10);
                    
                    if (last10Scores.length > 0) {
                        const sum = last10Scores.reduce((acc, s) => acc + s.score, 0);
                        const average = sum / last10Scores.length;
                        
                        calculatedAverages.push({
                            slug: skillSlug,
                            name: skillInfo.name,
                            icon: skillInfo.icon,
                            average: Math.round(average),
                            count: last10Scores.length
                        });
                    }
                }
            }

            setAverages(calculatedAverages);
            setIsLoading(false);
        }

        fetchAndCalculateScores();
    }, [student, isUserLoading]);

    if (isLoading || isUserLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Chargement de vos résultats...</p>
            </div>
        );
    }
    
     if (!student) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
                <Card className="p-8">
                    <h2 className="text-xl font-semibold text-destructive">Vous n'êtes pas connecté.</h2>
                    <Button asChild className="mt-4">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Retour à l'accueil
                        </Link>
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <header className="mb-12 text-center space-y-4 relative">
                <div className="absolute top-0 left-0">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/en-classe">
                            <Home className="mr-2" />
                            Retour
                        </Link>
                    </Button>
                </div>
                <Logo />
                <h2 className="font-headline text-4xl sm:text-5xl">Mes Progrès</h2>
                <p className="text-lg sm:text-xl text-muted-foreground">
                    Voici la moyenne de tes 10 derniers exercices dans chaque matière.
                </p>
            </header>
            
            {averages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {averages.map(skillAverage => (
                        <Card key={skillAverage.slug} className="flex flex-col items-center justify-start text-center p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <ErlenmeyerFlask score={skillAverage.average} />
                            <h3 className="font-headline text-2xl mt-[-1rem]">{skillAverage.name}</h3>
                            <p className="text-xs text-muted-foreground">({skillAverage.count} exercices)</p>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="w-full max-w-xl mx-auto p-12 text-center">
                    <h3 className="font-headline text-2xl">Aucun résultat pour le moment</h3>
                    <p className="text-muted-foreground mt-2">
                        Fais quelques exercices en classe pour voir tes progrès s'afficher ici !
                    </p>
                </Card>
            )}
        </main>
    );
}
