
'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { UserContext } from '@/context/user-context';
import { Score, getScoresForUser } from '@/services/scores';
import { getSkillBySlug } from '@/lib/skills';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Loader2, Rocket } from 'lucide-react';
import { ErlenmeyerFlask } from '@/components/erlenmeyer-flask';
import { Logo } from '@/components/logo';

interface SkillAverage {
    slug: string;
    name: string;
    icon: React.ReactElement;
    average: number;
    count: number;
    lastScore?: number;
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

            // 1. Fetch all scores for the student.
            const allScores = await getScoresForUser(student.id);

            if (allScores.length === 0) {
                setAverages([]);
                setIsLoading(false);
                return;
            }

            // 2. Group scores by skill slug.
            const scoresBySkill: Record<string, number[]> = {};
            allScores.forEach(score => {
                if (score && score.skill && typeof score.score === 'number') {
                    if (!scoresBySkill[score.skill]) {
                        scoresBySkill[score.skill] = [];
                    }
                    scoresBySkill[score.skill].push(score.score);
                }
            });
            
            // 3. Calculate average for each skill group.
            const calculatedAverages: SkillAverage[] = [];
            for (const skillSlug in scoresBySkill) {
                const skillInfo = getSkillBySlug(skillSlug);
                if (skillInfo) {
                    const skillScores = scoresBySkill[skillSlug];
                    const lastScores = skillScores.slice(0, 10);
                    
                    if (lastScores.length > 0) {
                        const sum = lastScores.reduce((acc, s) => acc + s, 0);
                        const average = sum / lastScores.length;
                        
                        const avg: SkillAverage = {
                            slug: skillSlug,
                            name: skillInfo.name,
                            icon: skillInfo.icon,
                            average: Math.round(average),
                            count: lastScores.length
                        };

                        if (skillSlug === 'reading-race') {
                            avg.lastScore = lastScores[0];
                        }
                        
                        calculatedAverages.push(avg);
                    }
                }
            }

            setAverages(calculatedAverages);
            setIsLoading(false);
        }

        if (!isUserLoading) {
            fetchAndCalculateScores();
        }
    }, [student, isUserLoading]);

    if (isLoading || isUserLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Chargement de tes résultats...</p>
            </div>
        );
    }
    
     if (!student) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center text-center p-4">
                <Card className="p-8">
                    <h2 className="text-xl font-semibold text-destructive">Tu n'es pas connecté.</h2>
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
                             {skillAverage.slug === 'reading-race' ? (
                                <div className="relative flex flex-col items-center justify-center mb-6 h-[150px] w-[120px]">
                                     <Rocket className="h-16 w-16 text-primary" />
                                     <p className="text-4xl font-bold font-headline mt-4">{skillAverage.lastScore}</p>
                                     <p className="text-sm text-muted-foreground">MCLM</p>
                                </div>
                            ) : (
                                <ErlenmeyerFlask score={skillAverage.average} />
                            )}
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
