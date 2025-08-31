
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Book, Users, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ModeSelectionPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedName = localStorage.getItem('classemagique_username');
      if (storedName) {
        setUsername(storedName);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, []);

  const handleUserChange = () => {
    try {
      localStorage.removeItem('classemagique_username');
      setUsername(null);
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="absolute top-8">
        <Logo />
      </div>
      <div className="text-center mb-12">
        {isClient && username && (
           <p className="text-base sm:text-lg text-muted-foreground mt-2">Connecté en tant que <span className="font-bold">{username}</span>.</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-sm md:max-w-4xl">
        <Link href="/devoirs" className="group" aria-label="Accéder aux devoirs">
          <Card className="flex h-full flex-col items-center justify-center p-8 sm:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
            <div className="mb-6 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-24 sm:[&>svg]:w-24">
              <Book />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-3xl sm:text-4xl">Devoirs</CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                Accédez à vos exercices et devoirs personnalisés.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/en-classe" className="group" aria-label="Accéder au mode En classe">
          <Card className="flex h-full flex-col items-center justify-center p-8 sm:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
            <div className="mb-6 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-24 sm:[&>svg]:w-24">
              <Users />
            </div>
             <CardHeader>
              <CardTitle className="font-headline text-3xl sm:text-4xl">En classe</CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                Utilisez les outils interactifs et les exercices en direct.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
      {isClient && username && (
        <div className="mt-12">
            <Button onClick={handleUserChange} variant="outline" size="lg">
                <UserCog className="mr-2" />
                Changer d'utilisateur
            </Button>
        </div>
      )}
    </main>
  );
}
