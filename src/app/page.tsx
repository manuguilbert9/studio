'use client';

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { skills } from '@/lib/skills';
import { Logo } from '@/components/logo';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedName = localStorage.getItem('skillfiesta_username');
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
      setName(trimmedName);
      try {
        localStorage.setItem('skillfiesta_username', trimmedName);
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
        <div className="absolute top-8 left-8">
          <Logo />
        </div>
        <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-4xl">Welcome!</CardTitle>
            <CardDescription className="text-lg">
              Let's get started. What should we call you?
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">First Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="text-base h-12"
                  required
                  aria-label="First Name"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-6 bg-accent text-accent-foreground hover:bg-accent/90">
                Continue <ArrowRight className="ml-2" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center space-y-4">
        <Logo />
        <h2 className="font-headline text-5xl">Hello, {name}!</h2>
        <p className="text-xl text-muted-foreground">What would you like to practice today?</p>
      </header>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <Link href={`/exercise/${skill.slug}`} key={skill.slug} className="group" aria-label={`Practice ${skill.name}`}>
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10">
              <div className="mb-4 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-20 [&>svg]:w-20">
                {skill.icon}
              </div>
              <h3 className="font-headline text-3xl mb-2">{skill.name}</h3>
              <p className="text-muted-foreground">{skill.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
