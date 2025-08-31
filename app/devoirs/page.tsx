'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function DevoirsPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-8 bg-background">
       <div className="absolute top-8">
        <Logo />
      </div>
        <Card className="w-full max-w-lg text-center p-12">
            <CardHeader>
                <CardTitle className="font-headline text-4xl">Section Devoirs</CardTitle>
                <CardDescription className="text-muted-foreground text-lg mt-2">
                    Cette section est en cours de construction. Revenez bientôt !
                </CardDescription>
            </CardHeader>
            <Button asChild size="lg" className="mt-6">
                <Link href="/">
                    <Home className="mr-2"/>
                    Retour à l'accueil
                </Link>
            </Button>
        </Card>
    </main>
  );
}
