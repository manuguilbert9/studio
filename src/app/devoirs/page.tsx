
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function DevoirsPage() {

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
       <div className="absolute top-8">
         <Logo />
       </div>
       <Card className="w-full max-w-lg text-center p-8">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">En cours de refonte</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    La section des devoirs est actuellement en cours de reconstruction pour être plus fiable et plus performante.
                </p>
                <Button asChild className="mt-6" variant="outline">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4"/>
                        Retour à l'accueil
                    </Link>
                </Button>
            </CardContent>
       </Card>
    </main>
  );
}
