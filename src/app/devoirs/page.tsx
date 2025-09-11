

'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Home, CheckCircle, List, BookOpen, Calculator } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getSpellingLists, getSpellingProgress, SpellingList } from '@/services/spelling';
import { UserContext } from '@/context/user-context';
import { getCurrentHomeworkConfig, HomeworkAssignment } from '@/services/teacher';
import { getSkillBySlug } from '@/lib/skills';
import { getScoresForUser, hasDoneMathHomework } from '@/services/scores';

function HomeworkList() {
  const router = useRouter();
  const { student, isLoading: isUserLoading } = useContext(UserContext);

  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([]);
  const [spellingProgress, setSpellingProgress] = useState<Record<string, boolean>>({});
  
  const [currentHomework, setCurrentHomework] = useState<{ listId: string | null, skillSlugLundi: string | null, skillSlugJeudi: string | null } | null>(null);

  const [isMathLundiDone, setIsMathLundiDone] = useState(false);
  const [isMathJeudiDone, setIsMathJeudiDone] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!student) {
          setIsLoading(false);
          return;
      };

      setIsLoading(true);

      // 1. Get global homework config
      const globalHomework = await getCurrentHomeworkConfig();
      
      // 2. Check for student-specific overrides for the current week
      const studentOverrides = student.homeworkOverrides || {};
      const currentWeekKey = globalHomework.weekOf;
      const studentHomework = currentWeekKey ? studentOverrides[currentWeekKey] : undefined;

      const finalHomework = studentHomework !== undefined ? studentHomework : globalHomework;
      setCurrentHomework(finalHomework);
      
      const [lists, progress] = await Promise.all([
        getSpellingLists(),
        getSpellingProgress(student.id),
      ]);
      
      setSpellingLists(lists);
      setSpellingProgress(progress);
      
      if (finalHomework.skillSlugLundi) {
        setIsMathLundiDone(await hasDoneMathHomework(student.id, finalHomework.skillSlugLundi, 'lundi'));
      }
      if (finalHomework.skillSlugJeudi) {
        setIsMathJeudiDone(await hasDoneMathHomework(student.id, finalHomework.skillSlugJeudi, 'jeudi'));
      }

      setIsLoading(false);
    }
    
    if (!isUserLoading) {
      loadData();
    }
  }, [student, isUserLoading]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des devoirs...</p>
      </div>
    );
  }
  
  if (!student) {
    return (
      <Card className="w-full text-center p-8">
        <CardTitle>Veuillez vous connecter</CardTitle>
        <CardContent>
          <p className='mt-4'>Vous devez être connecté pour voir les devoirs.</p>
          <Button asChild className="mt-4">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const currentList = spellingLists.find(list => list.id === currentHomework?.listId);
  const mathSkillLundi = getSkillBySlug(currentHomework?.skillSlugLundi || '');
  const mathSkillJeudi = getSkillBySlug(currentHomework?.skillSlugJeudi || '');
  
  const hasHomeworkForLundi = currentList || mathSkillLundi;
  const hasHomeworkForJeudi = currentList || mathSkillJeudi;

  return (
    <div className="space-y-8">
        <Card className="w-full bg-secondary/50 border-primary/50">
            <CardHeader>
                <CardTitle className="font-headline text-3xl sm:text-4xl text-center">Devoirs de la semaine</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lundi Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Pour Lundi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentList && (
                            <Button 
                                variant={spellingProgress[`${currentList.id}-lundi`] ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/devoirs/${currentList.id}-lundi/select`)}
                            >
                                <span className="flex items-center gap-2"><BookOpen className="h-5 w-5"/>Orthographe: {currentList.id}</span>
                                {spellingProgress[`${currentList.id}-lundi`] && <CheckCircle className="text-green-500"/>}
                            </Button>
                        )}
                         {mathSkillLundi ? (
                            <Button 
                                variant={isMathLundiDone ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/exercise/${mathSkillLundi.slug}?homework=lundi`)}
                            >
                                <span className="flex items-center gap-2"><Calculator className="h-5 w-5"/>Maths: {mathSkillLundi.name}</span>
                                {isMathLundiDone && <CheckCircle className="text-green-500"/>}
                            </Button>
                        ) : (
                           !currentList && <div className="text-center text-sm text-muted-foreground p-4">Aucun devoir pour lundi.</div>
                        )}
                         {!hasHomeworkForLundi && <div className="text-center text-sm text-muted-foreground p-4">Aucun devoir pour lundi.</div>}
                    </CardContent>
                </Card>

                 {/* Jeudi Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Pour Jeudi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentList && (
                           <Button 
                                variant={spellingProgress[`${currentList.id}-jeudi`] ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/devoirs/${currentList.id}-jeudi/select`)}
                            >
                                <span className="flex items-center gap-2"><BookOpen className="h-5 w-5"/>Orthographe: {currentList.id}</span>
                                {spellingProgress[`${currentList.id}-jeudi`] && <CheckCircle className="text-green-500"/>}
                            </Button>
                        )}
                        {mathSkillJeudi ? (
                             <Button 
                                variant={isMathJeudiDone ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/exercise/${mathSkillJeudi.slug}?homework=jeudi`)}
                            >
                                <span className="flex items-center gap-2"><Calculator className="h-5 w-5"/>Maths: {mathSkillJeudi.name}</span>
                                {isMathJeudiDone && <CheckCircle className="text-green-500"/>}
                            </Button>
                        ) : (
                             !currentList && <div className="text-center text-sm text-muted-foreground p-4">Aucun devoir pour jeudi.</div>
                        )}
                         {!hasHomeworkForJeudi && <div className="text-center text-sm text-muted-foreground p-4">Aucun devoir pour jeudi.</div>}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

        <Card className="w-full">
        <CardHeader>
            <CardTitle className="font-headline text-3xl sm:text-4xl text-center flex items-center justify-center gap-4">
                <List /> Toutes les listes d'orthographe
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {spellingLists.map(list => (
                <Card key={list.id} className="p-4">
                <h3 className="font-headline text-xl mb-2">{list.id} – {list.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                    { session: 'Lundi', exerciseId: `${list.id}-lundi` },
                    { session: 'Jeudi', exerciseId: `${list.id}-jeudi` }
                    ].map(({ session, exerciseId }) => {
                    const isCompleted = spellingProgress[exerciseId.toLowerCase()] || false;
                    return (
                        <Button 
                            key={exerciseId} 
                            variant={isCompleted ? "secondary" : "default"} 
                            className="h-14 text-base justify-between"
                            onClick={() => router.push(`/devoirs/${exerciseId}/select`)}
                        >
                            <span>{list.id} : {session}</span>
                            {isCompleted && <CheckCircle className="text-green-500"/>}
                        </Button>
                    )
                    })}
                </div>
                </Card>
            ))}
            </div>
        </CardContent>
        </Card>
    </div>
  );
}


export default function DevoirsPage() {
    return (
        <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
            <div className="w-full max-w-4xl">
                <header className="relative flex items-center justify-between mb-8">
                    <Button asChild variant="ghost" className="hidden sm:inline-flex">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="sm:hidden">
                    <Link href="/" aria-label="Retour à l'accueil">
                        <Home className="h-5 w-5" />
                    </Link>
                    </Button>
                    <div className="flex-grow flex justify-center">
                        <Logo />
                    </div>
                     <Button asChild variant="ghost">
                        <Link href="/devoirs/listes">
                            <List className="mr-2 h-4 w-4" />
                            Voir les listes
                        </Link>
                     </Button>
                </header>
                <HomeworkList />
            </div>
        </main>
    );
}
