
'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { UserContext } from '@/context/user-context';
import { Score, getScoresForUser } from '@/services/scores';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Loader2, CalendarDays, Calendar, CalendarRange } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ResultsCarousel } from '@/components/results/results-carousel';
import { OverallProgressChart } from '@/components/results/overall-progress-chart';
import { 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  subDays, 
  addDays, 
  subWeeks, 
  addWeeks, 
  subMonths, 
  addMonths, 
  format
} from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ResultsPage() {
    const { student, isLoading: isUserLoading } = useContext(UserContext);
    const [allScores, setAllScores] = useState<Score[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentDay, setCurrentDay] = useState(new Date());
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        async function fetchScores() {
            if (!student) {
                if (!isUserLoading) setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const scores = await getScoresForUser(student.id);
            setAllScores(scores);
            setIsLoading(false);
        }

        if (!isUserLoading) {
            fetchScores();
        }
    }, [student, isUserLoading]);
    
    const scoresForDay = allScores.filter(score => isSameDay(new Date(score.createdAt), currentDay));
    const scoresForWeek = allScores.filter(score => isSameWeek(new Date(score.createdAt), currentWeek, { locale: fr }));
    const scoresForMonth = allScores.filter(score => isSameMonth(new Date(score.createdAt), currentMonth));
    

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
            </header>
            
            <div className="space-y-12">
                <section>
                    <ResultsCarousel
                        title="Aujourd'hui"
                        subtitle={format(currentDay, "EEEE d MMMM", { locale: fr })}
                        icon={<CalendarDays />}
                        scores={scoresForDay}
                        onPrevious={() => setCurrentDay(d => subDays(d, 1))}
                        onNext={() => setCurrentDay(d => addDays(d, 1))}
                        isNextDisabled={isSameDay(currentDay, new Date())}
                    />
                </section>
                
                <section>
                     <ResultsCarousel
                        title="Cette Semaine"
                        subtitle={`Semaine du ${format(currentWeek, "d MMM", { locale: fr })}`}
                        icon={<Calendar />}
                        scores={scoresForWeek}
                        onPrevious={() => setCurrentWeek(w => subWeeks(w, 1))}
                        onNext={() => setCurrentWeek(w => addWeeks(w, 1))}
                        isNextDisabled={isSameWeek(currentWeek, new Date(), { locale: fr })}
                    />
                </section>

                <section>
                     <ResultsCarousel
                        title="Ce Mois-ci"
                        subtitle={format(currentMonth, "MMMM yyyy", { locale: fr })}
                        icon={<CalendarRange />}
                        scores={scoresForMonth}
                        onPrevious={() => setCurrentMonth(m => subMonths(m, 1))}
                        onNext={() => setCurrentMonth(m => addMonths(m, 1))}
                        isNextDisabled={isSameMonth(currentMonth, new Date())}
                    />
                </section>
                
                <section>
                    <OverallProgressChart allScores={allScores} />
                </section>
            </div>
        </main>
    );
}

