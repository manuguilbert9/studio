

'use client';

import { useContext, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { skills as allSkills, type Skill, allSkillCategories, SkillCategory } from '@/lib/skills';
import { Logo } from '@/components/logo';
import { Home, BarChart3, CheckCircle, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserContext } from '@/context/user-context';
import { FullscreenToggle } from '@/components/fullscreen-toggle';
import { getScoresForUser } from '@/services/scores';
import { isToday } from 'date-fns';

export default function EnClassePage() {
  const { student, isLoading: isUserLoading } = useContext(UserContext);
  const [enabledSkillsList, setEnabledSkillsList] = useState<Skill[] | null>(null);
  const [skillsCompletedToday, setSkillsCompletedToday] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      async function determineEnabledSkills() {
        if (!student) {
            if (!isUserLoading) {
                // For non-logged in state, we might show a default set or nothing
                setEnabledSkillsList([]); 
                setIsLoading(false);
            }
            return;
        }

        setIsLoading(true);

        // Fetch scores to determine which exercises were completed today
        const scores = await getScoresForUser(student.id);
        const completedToday = new Set<string>();
        scores.forEach(score => {
            if (isToday(new Date(score.createdAt))) {
                completedToday.add(score.skill);
            }
        });
        setSkillsCompletedToday(completedToday);

        const studentSkills = student.enabledSkills;

        // Default to all skills enabled if the student record doesn't have the property
        const defaultAllEnabled: Record<string, boolean> = {};
        allSkills.forEach(skill => defaultAllEnabled[skill.slug] = true);
        
        const effectiveEnabledSkills = studentSkills ?? defaultAllEnabled;

        const filteredSkills = allSkills.filter(skill => {
           return effectiveEnabledSkills[skill.slug] ?? false; // Default to false if a new skill is added and not in the student's map
        });
        
        setEnabledSkillsList(filteredSkills);
        setIsLoading(false);
      }

      if (!isUserLoading) {
        determineEnabledSkills();
      }
  }, [student, isUserLoading]);

  const skillsByCategory = useMemo(() => {
    if (!enabledSkillsList) return {};
    const grouped: Record<string, Skill[]> = {};
    for (const skill of enabledSkillsList) {
        if (!grouped[skill.category]) {
            grouped[skill.category] = [];
        }
        grouped[skill.category].push(skill);
    }
    return grouped;
  }, [enabledSkillsList]);

  if (isLoading || isUserLoading) {
    return (
        <main className="container mx-auto px-4 py-8">
            <header className="mb-12 text-center space-y-4">
                <Skeleton className="h-10 w-48 mx-auto" />
                <Skeleton className="h-12 w-80 mx-auto" />
                <Skeleton className="h-8 w-64 mx-auto" />
            </header>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="flex h-full flex-col items-center justify-center p-6 text-center">
                        <Skeleton className="h-20 w-20 rounded-full mb-4" />
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </Card>
                ))}
            </div>
        </main>
    );
  }
  
  if (!student) {
       return (
        <main className="container mx-auto px-4 py-8">
            <header className="mb-12 text-center space-y-4">
                <Logo />
                 <h2 className="font-headline text-4xl sm:text-5xl">Veuillez vous connecter</h2>
                 <Button asChild>
                    <Link href="/">Retour à l'accueil</Link>
                 </Button>
            </header>
        </main>
       )
  }

  return (
    <main className="container mx-auto px-4 py-8">
       <header className="mb-12 text-center space-y-4 relative">
        <div className="absolute top-0 left-0 flex items-center gap-2">
             <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <Home className="mr-2" />
                    Accueil
                </Link>
            </Button>
            <FullscreenToggle />
        </div>
        <Logo />
        <h2 className="font-headline text-4xl sm:text-5xl">Bonjour, {student.name}!</h2>
        <p className="text-lg sm:text-xl text-muted-foreground">Que veux-tu pratiquer aujourd'hui ?</p>
         <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
             <Button asChild variant="outline" size="sm">
                <Link href="/results">
                    <BarChart3 className="mr-2" />
                    Mes Progrès
                </Link>
            </Button>
             {student.hasCustomSchedule && (
                <Button asChild variant="outline" size="sm">
                    <Link href="/planning">
                        <ListChecks className="mr-2" />
                        Mon Planning
                    </Link>
                </Button>
            )}
        </div>
      </header>
      
      {enabledSkillsList && enabledSkillsList.length > 0 ? (
        <div className="space-y-12">
          {allSkillCategories.map(category => {
            const categorySkills = skillsByCategory[category] || [];
            if (categorySkills.length === 0) return null; // Hide category if no skills are enabled for it
            
            return (
              <div key={category}>
                <h2 className="text-3xl font-headline border-b-2 border-primary pb-2 mb-6">{category}</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                  {categorySkills.map((skill) => (
                    <Link href={`/exercise/${skill.slug}`} key={skill.slug} className="group" aria-label={`Pratiquer ${skill.name}`}>
                      <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-primary/10 relative">
                        {skillsCompletedToday.has(skill.slug) && (
                            <CheckCircle className="absolute top-3 right-3 h-6 w-6 text-green-500 rounded-full" />
                        )}
                        <div className="mb-4 text-primary transition-transform duration-300 group-hover:scale-110 [&>svg]:h-16 [&>svg]:w-16 sm:[&>svg]:h-20 sm:[&>svg]:w-20">
                          {skill.icon}
                        </div>
                        <h3 className="font-headline text-2xl sm:text-3xl mb-2">{skill.name}</h3>
                        <p className="text-muted-foreground text-sm sm:text-base">{skill.description}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="w-full max-w-2xl mx-auto p-8 text-center">
            <h3 className="font-headline text-2xl">Aucun exercice n'est disponible</h3>
            <p className="text-muted-foreground mt-2">Ton enseignant n'a pas encore activé d'exercices pour le mode "En classe".</p>
        </Card>
      )}
    </main>
  );
}
