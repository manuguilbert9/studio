
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

// NOTE: This is a simple, non-production-ready password.
const TEACHER_PASSWORD = 'classe123';

export default function TeacherLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password === TEACHER_PASSWORD) {
      try {
        sessionStorage.setItem('teacher_authenticated', 'true');
        router.push('/teacher/dashboard');
      } catch (error) {
         console.error("Could not set sessionStorage", error);
         toast({
            variant: "destructive",
            title: "Erreur de navigateur",
            description: "Impossible de démarrer la session. Votre navigateur est peut-être en mode privé.",
        });
        setIsLoading(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Mot de passe incorrect",
        description: "Veuillez réessayer.",
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl sm:text-4xl">Accès Enseignant</CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Veuillez entrer le mot de passe.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-base h-12 pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
              {!isLoading && <ArrowRight className="ml-2" />}
            </Button>
             <Button variant="link" asChild>
                <Link href="/">Retour à l'accueil élève</Link>
             </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
