
'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Book, Users, UserCog, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ModeSelectionPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
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
      window.location.reload();
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const trimmedName = inputValue.trim();
      try {
        localStorage.setItem('classemagique_username', trimmedName);
        setUsername(trimmedName);
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
    }
  };
  
  if (!isClient) {
      return (
         <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
             {/* Render a skeleton or loading state */}
         </main>
      )
  }

  if (!username) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Logo />
        </div>
        <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl sm:text-4xl">Bienvenue !</CardTitle>
            <CardDescription className="text-base sm:text-lg">
              Commençons. Comment devrions-nous vous appeler ?
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Prénom</Label>
                <Input
                  id="name"
                  placeholder="Entrez votre nom..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="text-base h-12"
                  required
                  aria-label="Prénom"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90">
                Continuer <ArrowRight className="ml-2" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="absolute top-8">
        <Logo />
      </div>
       <div className="text-center mb-12">
            <p className="text-base sm:text-lg text-muted-foreground mt-2">Connecté en tant que <span className="font-bold">{username}</span>.</p>
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
        <div className="mt-12">
            <Button onClick={handleUserChange} variant="outline" size="lg">
                <UserCog className="mr-2" />
                Changer d'utilisateur
            </Button>
        </div>
    </main>
  );
}
