

'use client';

import { useState, FormEvent, useContext } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Book, Users, LogOut, ArrowRight, School, KeyRound, User, Loader2, BookHeart, Palette, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserContext } from '@/context/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import { loginStudent } from '@/services/students';
import { useToast } from '@/hooks/use-toast';

export default function ModeSelectionPage() {
  const { student, setStudent, isLoading } = useContext(UserContext);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    setStudent(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      setIsLoggingIn(true);
      const loggedInStudent = await loginStudent(name, code);
      setIsLoggingIn(false);
      if (loggedInStudent) {
        setStudent(loggedInStudent);
      } else {
        toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Le prénom ou le code est incorrect. Veuillez réessayer.",
        });
      }
    }
  };
  
  if (isLoading) {
      return (
         <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
             <Skeleton className="h-12 w-1/2" />
         </main>
      )
  }

  if (!student) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background relative">
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Logo />
        </div>
        <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl sm:text-4xl">Bienvenue !</CardTitle>
            <CardDescription className="text-base sm:text-lg">
              Connecte-toi pour commencer.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Prénom</Label>
                 <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Ton prénom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-base h-12 pl-10"
                      required
                      aria-label="Prénom"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-base">Code secret</Label>
                 <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="Ton code à 4 chiffres"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-base h-12 pl-10 font-mono tracking-[0.5em]"
                      required
                      maxLength={4}
                      aria-label="Code secret"
                    />
                 </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : "Continuer"}
                {!isLoggingIn && <ArrowRight className="ml-2" />}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <div className="absolute bottom-4 right-4">
             <Button asChild variant="ghost" size="sm">
                <Link href="/teacher/login">
                    <School className="mr-2"/>
                    Accès enseignant
                </Link>
            </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background relative">
      <div className="absolute top-8 text-center space-y-4">
        <Logo />
        <p className="text-base sm:text-lg text-muted-foreground mt-2">Connecté en tant que <span className="font-bold">{student.name}</span>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-sm md:max-w-4xl pt-32">
        <Link href="/devoirs" className="group" aria-label="Accéder aux devoirs">
          <Card className="flex h-full flex-col items-center justify-center p-8 sm:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
            <div className="mb-6 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-24 sm:[&>svg]:w-24">
              <Book />
            </div>
            <CardHeader>
              <CardTitle className="font-headline text-3xl sm:text-4xl">Devoirs</CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                Accède à tes exercices et devoirs personnalisés.
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
                Utilise les outils interactifs et les exercices en direct.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/story-box" className="group" aria-label="Accéder à la Boîte à Histoires">
          <Card className="flex h-full flex-col items-center justify-center p-8 sm:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
            <div className="mb-6 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-24 sm:[&>svg]:w-24">
              <BookHeart />
            </div>
             <CardHeader>
              <CardTitle className="font-headline text-3xl sm:text-4xl">Boîte à Histoires</CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                Crée des histoires magiques avec l'aide de l'IA.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
         <Link href="/results" className="group" aria-label="Accéder aux résultats">
          <Card className="flex h-full flex-col items-center justify-center p-8 sm:p-12 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
            <div className="mb-6 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-24 sm:[&>svg]:w-24">
              <BarChart3 />
            </div>
             <CardHeader>
              <CardTitle className="font-headline text-3xl sm:text-4xl">Mes Progrès</CardTitle>
              <CardDescription className="text-muted-foreground text-base sm:text-lg mt-2">
                Consulte tes scores et suis ta progression.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
                <Link href="/customize">
                    <Palette/>
                    <span className="sr-only">Personnaliser</span>
                </Link>
            </Button>
             <Button asChild variant="ghost" size="sm">
                <Link href="/teacher/login">
                    <School className="mr-2"/>
                    Accès enseignant
                </Link>
            </Button>
        </div>
         <div className="absolute bottom-4 left-4">
            <Button onClick={handleLogout} variant="outline" size="lg">
                <LogOut className="mr-2" />
                Déconnexion
            </Button>
        </div>
    </main>
  );
}
