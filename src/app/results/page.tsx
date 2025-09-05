
'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { UserContext } from '@/context/user-context';
import { Score, getScoresForUser } from '@/services/scores';
import { getSkillBySlug, difficultyLevelToString } from '@/lib/skills';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Loader2 } from 'lucide-react';
import { ErlenmeyerFlask } from '@/components/erlenmeyer-flask';
import { Logo } from '@/components/logo';

interface SkillResult {
    slug: string;
    name: string;
    level: string;
    average: number;
    count: number;
}

export default function ResultsPage() {
    const { student, isLoading: isUserLoading } = useContext(UserContext);
    const [results, setResults] = useState<SkillResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAndCalculateScores() {
            if (!student) {
                if (!isUserLoading) setIsLoading(false);
                return;
            }
            setIsLoading(true);

            const allScores = await getScoresForUser(student.id);

            if (allScores.length === 0) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            // Group scores by a composite key of skillSlug and difficultyLevel
            const scoresBySkillAndLevel: Record<string, Score[]> = {};

            for (const score of allScores) {
                const difficulty = difficultyLevelToString(score.skill, score.calculationSettings, score.currencySettings, score.timeSettings, score.calendarSettings) || 'Standard';
                const key = `${score.skill}::${difficulty}`;
                
                if (!scoresBySkillAndLevel[key]) {
                    scoresBySkillAndLevel[key] = [];
                }
                scoresBySkillAndLevel[key].push(score);
            }
            
            // Calculate average for each group
            const calculatedResults: SkillResult[] = [];
            for (const key in scoresBySkillAndLevel) {
                const [skillSlug, level] = key.split('::');
                const skillInfo = getSkillBySlug(skillSlug);

                if (skillInfo) {
                    const skillScores = scoresBySkillAndLevel[key];
                    const lastScores = skillScores.slice(0, 10).map(s => s.score);
                    
                    if (lastScores.length > 0) {
                        const sum = lastScores.reduce((acc, s) => acc + s, 0);
                        const average = sum / lastScores.length;
                        
                        calculatedResults.push({
                            slug: skillSlug,
                            name: skillInfo.name,
                            level: level,
                            average: Math.round(average),
                            count: lastScores.length
                        });
                    }
                }
            }

            // Sort results by name, then by level
            calculatedResults.sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                if (a.level < b.level) return -1;
                if (a.level > b.level) return 1;
                return 0;
            });


            setResults(calculatedResults);
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
            
            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {results.map(result => (
                        <Card key={`${result.slug}-${result.level}`} className="flex flex-col items-center justify-start text-center p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <ErlenmeyerFlask score={result.average} />
                            <h3 className="font-headline text-2xl mt-[-1rem]">{result.name}</h3>
                            <p className="font-semibold text-sm text-primary">{result.level}</p>
                            <p className="text-xs text-muted-foreground">({result.count} exercices)</p>
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
