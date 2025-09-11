
'use client';

import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowRight, BookOpen, BrainCircuit, Loader2 } from 'lucide-react';
import { getSkillBySlug } from '@/lib/skills';
import { UserContext } from '@/context/user-context';
import { getHomeworkForGroup, type Assignment } from '@/services/homework';
import { format, isBefore, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DatedAssignment {
  date: string;
  assignment: Assignment;
}

function HomeworkCard({ date, assignment }: { date: string, assignment: Assignment }) {
  const frenchSkill = assignment.francais ? getSkillBySlug(assignment.francais) : null;
  const mathSkill = assignment.maths ? getSkillBySlug(assignment.maths) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Pour le {format(new Date(date), 'EEEE d MMMM', { locale: fr })}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {frenchSkill ? (
          <Link href={`/exercise/${frenchSkill.slug}`} className="group">
            <Card className="hover:shadow-lg hover:border-primary transition-all p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                {frenchSkill.icon}
              </div>
              <div>
                <p className="font-semibold text-lg">{frenchSkill.name}</p>
                <p className="text-sm text-muted-foreground">Français</p>
              </div>
              <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>
        ) : (
          <Card className="p-4 flex items-center justify-center text-muted-foreground text-sm">Pas d'exercice de français.</Card>
        )}
        {mathSkill ? (
          <Link href={`/exercise/${mathSkill.slug}`} className="group">
            <Card className="hover:shadow-lg hover:border-primary transition-all p-4 flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600 group-hover:scale-110 transition-transform">
                {mathSkill.icon}
              </div>
              <div>
                <p className="font-semibold text-lg">{mathSkill.name}</p>
                <p className="text-sm text-muted-foreground">Mathématiques</p>
              </div>
               <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>
        ) : (
          <Card className="p-4 flex items-center justify-center text-muted-foreground text-sm">Pas d'exercice de mathématiques.</Card>
        )}
      </CardContent>
    </Card>
  );
}

export default function DevoirsPage() {
  const { student, isLoading: isUserLoading } = useContext(UserContext);
  const [futureHomework, setFutureHomework] = useState<DatedAssignment[]>([]);
  const [pastHomework, setPastHomework] = useState<DatedAssignment[]>([]);
  const [isLoadingHomework, setIsLoadingHomework] = useState(true);

  useEffect(() => {
    async function fetchHomework() {
      if (student?.groupId) {
        setIsLoadingHomework(true);
        const allAssignments = await getHomeworkForGroup(student.groupId);
        
        const today = startOfToday();
        const future: DatedAssignment[] = [];
        const past: DatedAssignment[] = [];

        allAssignments.forEach(item => {
          // The date from firestore is 'YYYY-MM-DD', which gets parsed as UTC midnight.
          // Add timezone offset to treat it as local date to prevent off-by-one day errors.
          const itemDate = new Date(item.date);
          const adjustedDate = new Date(itemDate.valueOf() + itemDate.getTimezoneOffset() * 60 * 1000);

          if (isBefore(adjustedDate, today)) {
            past.push(item);
          } else {
            future.push(item);
          }
        });
        
        // Sort future homework ascending, past homework descending
        future.sort((a,b) => a.date.localeCompare(b.date));
        past.sort((a,b) => b.date.localeCompare(a.date));

        setFutureHomework(future);
        setPastHomework(past);
        setIsLoadingHomework(false);
      } else if (!isUserLoading) {
        setIsLoadingHomework(false);
      }
    }
    fetchHomework();
  }, [student, isUserLoading]);

  if (isUserLoading || isLoadingHomework) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des devoirs...</p>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
        <div className="absolute top-8">
          <Logo />
        </div>
        <Card className="w-full max-w-lg text-center p-8">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Veuillez vous connecter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Vous devez être connecté pour voir vos devoirs.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
      <div className="absolute top-8 left-8">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Accueil
          </Link>
        </Button>
      </div>
      <div className="text-center mb-12">
        <Logo />
        <h1 className="font-headline text-5xl mt-4">Tes devoirs</h1>
        <p className="text-muted-foreground text-xl mt-2">Voici le programme des jours à venir.</p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        {futureHomework.length > 0 ? (
          futureHomework.map(item => <HomeworkCard key={item.date} date={item.date} assignment={item.assignment} />)
        ) : (
          <Card className="text-center p-8">
            <CardTitle>Aucun devoir à venir</CardTitle>
            <CardDescription className="mt-2">Il n'y a pas de devoirs prévus pour les jours prochains.</CardDescription>
          </Card>
        )}

        {pastHomework.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="past-homework">
              <AccordionTrigger className="text-2xl font-headline">
                Devoirs passés
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {pastHomework.map(item => <HomeworkCard key={item.date} date={item.date} assignment={item.assignment} />)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </main>
  );
}
