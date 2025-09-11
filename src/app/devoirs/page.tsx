
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Home, List } from 'lucide-react';
import { HomeworkList } from '@/components/homework-list';
import { getSpellingLists, SpellingList, getAllSpellingProgress, SpellingProgress, getSpellingProgress } from '@/services/spelling';
import { getCurrentHomeworkConfig, HomeworkAssignment } from '@/services/teacher';
import { getAllScores, Score } from '@/services/scores';

// This is now a Server Component. It fetches the data and passes it to the client component.
export default async function DevoirsPage() {
  // We fetch all data required by the client component here, on the server.
  const allSpellingLists = await getSpellingLists();
  const homeworkConfig = await getCurrentHomeworkConfig();
  // We can't know the student here, so we'll pass all progress and let the client component filter it.
  const allSpellingProgress = await getAllSpellingProgress();
  const allScores = await getAllScores();

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
        
        {/* The client component receives all necessary data as props */}
        <HomeworkList 
          initialHomeworkConfig={homeworkConfig}
          initialSpellingLists={allSpellingLists}
          allSpellingProgress={allSpellingProgress}
          allScores={allScores}
        />
      </div>
    </main>
  );
}
