
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
import { getCurrentHomeworkConfig } from '@/services/teacher';
import { getSkillBySlug } from '@/lib/skills';
import { getScoresForUser } from '@/services/scores';

function HomeworkList() {
  const router = useRouter();
  const { student, isLoading: isUserLoading } = useContext(UserContext);

  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([]);
  const [spellingProgress, setSpellingProgress] = useState<Record<string, boolean>>({});
  
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [currentMathSkillSlug, setCurrentMathSkillSlug] = useState<string | null>(null);
  const [isMathExerciseDone, setIsMathExerciseDone] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!student) {
          setIsLoading(false);
          return;
      };

      setIsLoading(true);
      const [lists, progress, { listId, skillSlug }] = await Promise.all([
        getSpellingLists(),
        getSpellingProgress(student.id),
        getCurrentHomeworkConfig()
      ]);
      
      setSpellingLists(lists);
      setSpellingProgress(progress);
      setCurrentListId(listId);
      setCurrentMathSkillSlug(skillSlug);

      if (skillSlug) {
        const mathScores = await getScoresForUser(student.id, skillSlug);
        if (mathScores.length > 0) {
            setIsMathExerciseDone(true);
        }
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
  
  const currentList = spellingLists.find(list => list.id === currentListId);
  const currentMathSkill = getSkillBySlug(currentMathSkillSlug || '');

  return (
    <div className="space-y-8">
        <Card className="w-full bg-secondary/50 border-primary/50">
            <CardHeader>
                <CardTitle className="font-headline text-3xl sm:text-4xl text-center">Devoirs de la semaine</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Spelling Card */}
                 {currentList ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                                <BookOpen className="text-primary" />
                                <span>Orthographe</span>
                            </CardTitle>
                            <CardDescription>{currentList.id} – {currentList.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                            { session: 'Lundi', exerciseId: `${currentList.id}-lundi` },
                            { session: 'Jeudi', exerciseId: `${currentList.id}-jeudi` }
                            ].map(({ session, exerciseId }) => {
                            const isCompleted = spellingProgress[exerciseId.toLowerCase()] || false;
                            return (
                                <Button 
                                    key={exerciseId} 
                                    variant={isCompleted ? "secondary" : "default"} 
                                    className="w-full h-14 text-base justify-between"
                                    onClick={() => router.push(`/devoirs/${exerciseId}`)}
                                >
                                    <span>{currentList.id} : {session}</span>
                                    {isCompleted && <CheckCircle className="text-green-500"/>}
                                </Button>
                            )
                            })}
                        </CardContent>
                    </Card>
                 ) : (
                     <Card className="flex items-center justify-center p-8"><p className="text-muted-foreground">Aucun devoir d'orthographe assigné.</p></Card>
                 )}

                 {/* Math Card */}
                 {currentMathSkill ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                                <Calculator className="text-primary" />
                                <span>Mathématiques</span>
                            </CardTitle>
                            <CardDescription>{currentMathSkill.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button 
                                variant={isMathExerciseDone ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/exercise/${currentMathSkill.slug}`)}
                            >
                                <span>Faire l'exercice</span>
                                {isMathExerciseDone && <CheckCircle className="text-green-500"/>}
                            </Button>
                        </CardContent>
                    </Card>
                 ) : (
                     <Card className="flex items-center justify-center p-8"><p className="text-muted-foreground">Aucun exercice de maths assigné.</p></Card>
                 )}
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
                            onClick={() => router.push(`/devoirs/${exerciseId}`)}
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
