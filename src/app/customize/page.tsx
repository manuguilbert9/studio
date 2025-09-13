
'use client';

import { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserContext } from '@/context/user-context';
import { updateStudent, type ThemeColors } from '@/services/students';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

const defaultColors: ThemeColors = {
  background: '#e0f2f1', // light cyan
  primary: '#78d6c6', // sky blue
  accent: '#94a7e2', // light periwinkle
};

export default function CustomizePage() {
  const { student, isLoading: isUserLoading, refreshStudent } = useContext(UserContext);
  const { toast } = useToast();

  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && student) {
      setColors(student.themeColors || defaultColors);
      setIsLoading(false);
    } else if (!isUserLoading && !student) {
        setIsLoading(false);
    }
  }, [student, isUserLoading]);

  const handleColorChange = (colorName: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [colorName]: value }));
  };

  const handleSave = async () => {
    if (!student) return;
    setIsSaving(true);
    const result = await updateStudent(student.id, { themeColors: colors });
    if (result.success) {
      toast({
        title: 'Thème enregistré !',
        description: 'Ton nouvel univers de couleurs est prêt.',
      });
      refreshStudent(); // Refresh context to apply new theme everywhere
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les couleurs.',
      });
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </main>
    );
  }
  
  if(!student) {
       return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
             <div className="absolute top-8 left-1/2 -translate-x-1/2">
                <Logo />
             </div>
            <Card className="w-full max-w-lg text-center p-8">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Veuillez vous connecter</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                Vous devez être connecté pour personnaliser les couleurs.
                </p>
                <Button asChild className="mt-6" variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à l'accueil
                </Link>
                </Button>
            </CardContent>
            </Card>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-xl">
        <div className="mb-8">
             <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
              </Link>
            </Button>
        </div>
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl sm:text-4xl">Personnalise ton espace</CardTitle>
            <CardDescription className="text-base sm:text-lg">
              Choisis tes couleurs préférées pour rendre l'application unique !
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2 flex flex-col items-center">
              <Label htmlFor="bg-color" className="text-lg font-semibold">Couleur de fond</Label>
              <div className="relative w-24 h-24">
                <Input
                  id="bg-color"
                  type="color"
                  value={colors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                    className="w-full h-full rounded-full border-4 border-white shadow-md"
                    style={{ backgroundColor: colors.background }}
                />
              </div>
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <Label htmlFor="primary-color" className="text-lg font-semibold">Couleur primaire</Label>
               <div className="relative w-24 h-24">
                    <Input
                    id="primary-color"
                    type="color"
                    value={colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div 
                        className="w-full h-full rounded-full border-4 border-white shadow-md"
                        style={{ backgroundColor: colors.primary }}
                    />
              </div>
              <p className="text-xs text-muted-foreground text-center">Pour les titres et les boutons importants.</p>
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <Label htmlFor="accent-color" className="text-lg font-semibold">Couleur d'accent</Label>
              <div className="relative w-24 h-24">
                <Input
                    id="accent-color"
                    type="color"
                    value={colors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                    className="w-full h-full rounded-full border-4 border-white shadow-md"
                    style={{ backgroundColor: colors.accent }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">Pour les boutons secondaires et les sélections.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
              Enregistrer mes couleurs
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
