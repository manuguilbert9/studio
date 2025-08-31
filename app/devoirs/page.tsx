
'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Home, CheckCircle, Star, FileText } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getSpellingLists, getSpellingProgress, SpellingList } from '@/services/spelling';
import { getCurrentSpellingListId } from '@/services/teacher';
import { UserContext } from '@/context/user-context';

function DevoirsList() {
  const router = useRouter();
  const [lists, setLists] = useState<SpellingList[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { student, isLoading: isUserLoading } = useContext(UserContext);
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [spellingLists, currentId] = await Promise.all([
        getSpellingLists(),
        getCurrentSpellingListId()
      ]);
      
      setLists(spellingLists);
      setCurrentListId(currentId);

      if (student && student.id) {
        const userProgress = await getSpellingProgress(student.id);
        setProgress(userProgress);
      }
      setIsLoading(false);
    }
    
    if (!isUserLoading) {
      loadData();
    }
  }, [student, isUserLoading]);
  
  const sortedLists = useMemo(() => {
    if (!currentListId) return lists;
    
    const currentIndex = lists.findIndex(list => list.id === currentListId);
    if (currentIndex === -1) return lists;

    const currentList = lists[currentIndex];
    const pastLists = lists.slice(0, currentIndex).reverse(); // reverse to show most recent past first
    const futureLists = lists.slice(currentIndex + 1);

    return {
        current: currentList,
        past: pastLists,
        future: futureLists
    }

  }, [lists, currentListId]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des listes de devoirs...</p>
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

  const renderList = (list: SpellingList, isCurrent = false) => (
     <Card key={list.id} className="p-4">
        <h3 className="font-headline text-xl mb-2 flex items-center gap-2">
            {isCurrent && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400"/>}
            {list.id} – {list.title}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
            { session: 'Lundi', exerciseId: `${list.id}-lundi` },
            { session: 'Jeudi', exerciseId: `${list.id}-jeudi` }
        ].map(({ session, exerciseId }) => {
            const isCompleted = progress[exerciseId.toLowerCase()] || false;
            return (
            <Button 
                key={exerciseId} 
                variant={isCompleted ? "secondary" : (isCurrent ? "default" : "outline")} 
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
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-3xl sm:text-4xl text-center flex-grow">Devoirs d'Orthographe</CardTitle>
             <Button asChild variant="outline">
                <Link href="/devoirs/listes">
                    <FileText className="mr-2" />
                    Consulter les listes de mots
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {typeof sortedLists === 'object' && sortedLists.current ? (
             <div className="space-y-8">
                <div>
                    <h2 className="font-headline text-2xl mb-4 text-primary">Liste actuelle</h2>
                    {renderList(sortedLists.current, true)}
                </div>

                {sortedLists.past.length > 0 && (
                    <div>
                        <h2 className="font-headline text-2xl mb-4 text-muted-foreground">Listes passées</h2>
                        <div className="space-y-4 opacity-70">
                            {sortedLists.past.map(list => renderList(list))}
                        </div>
                    </div>
                )}
                 {sortedLists.future.length > 0 && (
                    <div>
                        <h2 className="font-headline text-2xl mb-4 text-muted-foreground">Listes à venir</h2>
                        <div className="space-y-4 opacity-70">
                            {sortedLists.future.map(list => renderList(list))}
                        </div>
                    </div>
                )}
            </div>
        ) : (
             <div className="space-y-4">
                {lists.map(list => renderList(list))}
            </div>
        )}
      </CardContent>
    </Card>
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
                    <div className="w-10 sm:w-[150px]"></div>
                </header>
                <DevoirsList />
            </div>
        </main>
    );
}
