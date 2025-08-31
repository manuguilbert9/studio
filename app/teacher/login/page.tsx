
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { ArrowRight, KeyRound } from 'lucide-react';

const TEACHER_PASSWORD = "classe_magique"; // Simple hardcoded password

export default function TeacherLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === TEACHER_PASSWORD) {
      try {
        sessionStorage.setItem('teacher_authenticated', 'true');
        router.push('/teacher/dashboard');
      } catch (error) {
        setError("Impossible d'accéder au stockage de session. Veuillez activer les cookies et le stockage local dans votre navigateur.");
      }
    } else {
      setError('Mot de passe incorrect.');
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl sm:text-4xl">Accès Enseignant</CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Veuillez entrer le mot de passe pour continuer.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-10 text-base h-12"
                  required
                />
              </div>
              {error && <p className="text-sm font-medium text-destructive pt-2">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6">
              Se connecter <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
