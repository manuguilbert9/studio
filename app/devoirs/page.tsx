
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Home, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getSpellingLists, getSpellingProgress, SpellingList } from '@/services/spelling';
import { cn } from '@/lib/utils';

export default function DevoirsListPage() {
  const [lists, setLists] = useState<SpellingList[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('classemagique_username');
    setUsername(storedName);

    async function loadData() {
      setIsLoading(true);
      const spellingLists = await getSpellingLists();
      setLists(spellingLists);
      if (storedName) {
        const userProgress = await getSpellingProgress(storedName);
        setProgress(userProgress);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des listes de devoirs...</p>
      </main>
    );
  }

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

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-headline text-3xl sm:text-4xl text-center">Devoirs d'Orthographe</CardTitle>
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
                       const isCompleted = progress[exerciseId] || false;
                       return (
                          <Button key={exerciseId} asChild variant={isCompleted ? "secondary" : "default"} className="h-14 text-base justify-between">
                            <Link href={`/devoirs/${exerciseId}`}>
                              <span>{list.id} : {session}</span>
                              {isCompleted && <CheckCircle className="text-green-500"/>}
                            </Link>
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
    </main>
  );
}
