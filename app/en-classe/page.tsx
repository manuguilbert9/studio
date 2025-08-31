
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { skills } from '@/lib/skills';
import { Logo } from '@/components/logo';
import { ArrowRight, BarChart3, Home, Presentation } from 'lucide-react';

export default function EnClassePage() {
  const [name, setName] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    try {
      const storedName = localStorage.getItem('classemagique_username');
      if (storedName) {
        setName(storedName);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const trimmedName = inputValue.trim();
      try {
        localStorage.setItem('classemagique_username', trimmedName);
        router.push('/');
      } catch (error) {
        console.error("Could not access localStorage", error);
      }
    }
  };

  if (!isClient) {
    return null; // Or a loading spinner
  }

  if (!name) {
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
           <Button asChild variant="link" className="mt-4">
                <Link href="/">
                    <Home className="mr-2"/>
                    Retour à l'accueil
                </Link>
            </Button>
        </Card>
      </main>
    );
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
        <h2 className="font-headline text-4xl sm:text-5xl">Bonjour, {name}!</h2>
        <p className="text-lg sm:text-xl text-muted-foreground">Que voudriez-vous pratiquer aujourd'hui ?</p>
         <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
            <Button asChild variant="outline" size="sm">
                <Link href="/results">
                    <BarChart3 className="mr-2" />
                    Résultats
                </Link>
            </Button>
             <Button asChild variant="outline" size="sm">
                <Link href="/tableau">
                    <Presentation className="mr-2" />
                    Tableau
                </Link>
            </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
        {skills.map((skill) => (
          <Link href={`/exercise/${skill.slug}`} key={skill.slug} className="group" aria-label={`Pratiquer ${skill.name}`}>
            <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
              <div className="mb-4 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-20 sm:[&>svg]:w-20">
                {skill.icon}
              </div>
              <h3 className="font-headline text-2xl sm:text-3xl mb-2">{skill.name}</h3>
              <p className="text-muted-foreground text-sm sm:text-base">{skill.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
