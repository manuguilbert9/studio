
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookCopy, Edit } from 'lucide-react';
import Link from 'next/link';

export default function SelectRevisionModePage() {
    const router = useRouter();
    const params = useParams();
    const { exerciseId } = params as { exerciseId: string };
    
    // The query param will tell us which mode to go to
    const handleSelectMode = (mode: 'dictation' | 'copy') => {
        router.push(`/devoirs/${exerciseId}/${mode}`);
    };

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
            <Card className="w-full max-w-lg text-center p-6 sm:p-10 shadow-2xl">
                <CardHeader>
                    <CardTitle className="font-headline text-4xl mb-2">Comment veux-tu réviser ?</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        Choisis ta méthode pour travailler la liste de mots.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <Button
                        variant="outline"
                        className="h-36 flex-col gap-3 text-lg"
                        onClick={() => handleSelectMode('dictation')}
                    >
                        <Edit className="h-10 w-10 text-primary" />
                        Mode Dictée
                    </Button>
                    <Button
                        variant="outline"
                        className="h-36 flex-col gap-3 text-lg"
                        onClick={() => handleSelectMode('copy')}
                    >
                        <BookCopy className="h-10 w-10 text-primary" />
                        Mode Copie
                    </Button>
                </CardContent>
            </Card>
             <Button asChild variant="link" className="mt-8">
                <Link href="/devoirs">Retour à la liste des devoirs</Link>
            </Button>
        </main>
    );
}
