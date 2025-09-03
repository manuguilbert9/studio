
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getSpellingLists } from '@/services/spelling';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';


export default async function WordListsPage() {
  const lists = await getSpellingLists();

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl">
        <header className="relative flex items-center justify-between mb-8">
          <Button asChild variant="ghost">
            <Link href="/devoirs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux devoirs
            </Link>
          </Button>
          <h1 className="font-headline text-2xl sm:text-3xl text-center flex-grow">
            Listes de mots d'orthographe
          </h1>
          <div className="w-auto sm:w-[180px]"></div>
        </header>

        <div className="space-y-8">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{list.id} – {list.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {list.words.map((word) => (
                    <span key={word} className="text-xl font-body">
                      {word.replace(/\|.*?\|/g, '').replace(/\(.*?\)/g, '')}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
