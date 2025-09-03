
'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Home, CheckCircle, List } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getSpellingLists, getSpellingProgress, SpellingList } from '@/services/spelling';
import { UserContext } from '@/context/user-context';
import { getCurrentSpellingListId } from '@/services/teacher';

function DevoirsList() {
  const router = useRouter();
  const { student, isLoading: isUserLoading } = useContext(UserContext);

  const [lists, setLists] = useState<SpellingList[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!student) {
          setIsLoading(false);
          return;
      };

      setIsLoading(true);
      const [spellingLists, userProgress, currentId] = await Promise.all([
        getSpellingLists(),
        getSpellingProgress(student.id),
        getCurrentSpellingListId()
      ]);
      
      setLists(spellingLists);
      setProgress(userProgress);
      setCurrentListId(currentId);
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
  
  const currentList = lists.find(list => list.id === currentListId);

  return (
    <div className="space-y-8">
        {currentList && (
            <Card className="w-full bg-secondary/50 border-primary/50">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl sm:text-4xl text-center">Devoirs de la semaine</CardTitle>
                    <CardDescription className="text-center">{currentList.id} – {currentList.title}</CardDescription>
                </CardHeader>
                 <CardContent>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                        { session: 'Lundi', exerciseId: `${currentList.id}-lundi` },
                        { session: 'Jeudi', exerciseId: `${currentList.id}-jeudi` }
                        ].map(({ session, exerciseId }) => {
                        const isCompleted = progress[exerciseId.toLowerCase()] || false;
                        return (
                            <Button 
                                key={exerciseId} 
                                variant={isCompleted ? "secondary" : "default"} 
                                className="h-16 text-lg justify-between"
                                onClick={() => router.push(`/devoirs/${exerciseId}`)}
                            >
                                <span>{currentList.id} : {session}</span>
                                {isCompleted && <CheckCircle className="text-green-500"/>}
                            </Button>
                        )
                        })}
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className="w-full">
        <CardHeader>
            <CardTitle className="font-headline text-3xl sm:text-4xl text-center flex items-center justify-center gap-4">
                <List /> Toutes les listes
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {lists.map(list => (
                <Card key={list.id} className="p-4">
                <h3 className="font-headline text-xl mb-2">{list.id} – {list.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                    { session: 'Lundi', exerciseId: `${list.id}-lundi` },
                    { session: 'Jeudi', exerciseId: `${list.id}-jeudi` }
                    ].map(({ session, exerciseId }) => {
                    const isCompleted = progress[exerciseId.toLowerCase()] || false;
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
                <DevoirsList />
            </div>
        </main>
    );
}
