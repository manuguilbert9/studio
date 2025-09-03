
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Home, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentManager } from '@/components/teacher/student-manager';
import { HomeworkTracker } from '@/components/teacher/homework-tracker';
import { ExercisesManager } from '@/components/teacher/exercises-manager';
import { getSpellingLists, SpellingList, getAllSpellingProgress, SpellingProgress } from '@/services/spelling';
import { getStudents, Student } from '@/services/students';


export default function TeacherDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

   // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([]);
  const [allProgress, setAllProgress] = useState<SpellingProgress[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [studentData, listsData, progressData] = await Promise.all([
      getStudents(),
      getSpellingLists(),
      getAllSpellingProgress()
    ]);
    setStudents(studentData);
    setSpellingLists(listsData);
    setAllProgress(progressData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('teacher_authenticated') === 'true';
    if (!isAuth) {
      router.replace('/teacher/login');
    } else {
      setIsAuthenticated(true);
      loadData();
    }
  }, [router, loadData]);
  
  const handleLogout = () => {
    sessionStorage.removeItem('teacher_authenticated');
    router.push('/');
  }

  if (!isAuthenticated) {
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
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="students">Gestion des élèves</TabsTrigger>
                    <TabsTrigger value="homework">Suivi des devoirs</TabsTrigger>
                    <TabsTrigger value="exercises">Exercices en classe</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-6">
                    <StudentManager />
                </TabsContent>
                <TabsContent value="homework" className="mt-6">
                    <HomeworkTracker students={students} spellingLists={spellingLists} allProgress={allProgress}/>
                </TabsContent>
                <TabsContent value="exercises" className="mt-6">
                    <ExercisesManager />
                </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </TooltipProvider>
  );
}
