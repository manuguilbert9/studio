
'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Logo } from '@/components/logo';
import { UserContext } from '@/context/user-context';
import { StudentSchedule } from '@/components/student-schedule';
import { Card } from '@/components/ui/card';

export default function PlanningPage() {
    const { student, isLoading } = useContext(UserContext);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Logo /></div>;
    }

    if (!student) {
        return (
             <main className="container mx-auto px-4 py-8">
                <header className="mb-12 text-center space-y-4">
                    <Logo />
                     <h2 className="font-headline text-4xl sm:text-5xl">Veuillez vous connecter</h2>
                     <Button asChild>
                        <Link href="/">Retour à l'accueil</Link>
                     </Button>
                </header>
            </main>
        )
    }

    return (
        <main className="container mx-auto px-4 py-8">
             <header className="mb-12 text-center space-y-4 relative">
                <div className="absolute top-0 left-0">
                     <Button asChild variant="outline" size="sm">
                        <Link href="/">
                            <Home className="mr-2" />
                            Accueil
                        </Link>
                    </Button>
                </div>
                <Logo />
                <h2 className="font-headline text-4xl sm:text-5xl">Planning de la journée</h2>
                <p className="text-lg sm:text-xl text-muted-foreground">Voici le programme pour aujourd'hui, {student.name} !</p>
            </header>
            
            <StudentSchedule />

        </main>
    );
}
