
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Home, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getStudents, type Student } from '@/services/students';
import { getSpellingLists, getAllSpellingProgress, SpellingProgress, SpellingList } from '@/services/spelling';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentManager } from '@/components/teacher/student-manager';
import { HomeworkTracker } from '@/components/teacher/homework-tracker';
import { ExercisesManager } from '@/components/teacher/exercises-manager';


export default function TeacherDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([]);
  const [allProgress, setAllProgress] = useState<SpellingProgress[]>([]);

  const loadDashboardData = useCallback(async () => {
      try {
        const [studentData, listsData, progressData] = await Promise.all([
            getStudents(),
            getSpellingLists(),
            getAllSpellingProgress()
        ]);
        setStudents(studentData);
        setSpellingLists(listsData);
        setAllProgress(progressData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({
          variant: 'destructive',
          title: "Erreur de chargement",
          description: "Impossible de charger les données du tableau de bord.",
        });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    // This effect should only run once on mount to check auth.
    const isAuth = sessionStorage.getItem('teacher_authenticated') === 'true';
    if (!isAuth) {
      router.replace('/teacher/login');
    } else {
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, [router, loadDashboardData]);
  
  const handleLogout = () => {
    sessionStorage.removeItem('teacher_authenticated');
    router.push('/');
  }

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
          <Logo />
          <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                  <Link href="/"><Home className="mr-2"/> Accueil Principal</Link>
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2"/> Déconnexion
              </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto mt-4">
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="students">Gestion des élèves</TabsTrigger>
                    <TabsTrigger value="homework">Suivi des devoirs</TabsTrigger>
                    <TabsTrigger value="exercises">Exercices en classe</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-6">
                    <StudentManager initialStudents={students} />
                </TabsContent>
                <TabsContent value="homework" className="mt-6">
                    <HomeworkTracker students={students} spellingLists={spellingLists} allProgress={allProgress}/>
                </TabsContent>
                <TabsContent value="exercises" className="mt-6">
                    <ExercisesManager />
                </TabsContent>
            </Tabs>
        </div>
      </main>
    </TooltipProvider>
  );
}
