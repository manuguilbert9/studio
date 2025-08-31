
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WordListsPage() {
  // Use the correct filename with underscores.
  const pdfPath = "/orthographe/listes_de_mots.pdf";

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
            
            <div className="w-full h-[calc(100vh-150px)] rounded-lg overflow-hidden border">
                 <iframe 
                    src={pdfPath}
                    className="w-full h-full"
                    title="Listes de mots d'orthographe"
                />
            </div>
        </div>
    </main>
  );
}
