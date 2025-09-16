

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Home, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentManager } from '@/components/teacher/student-manager';
import { ResultsManager } from '@/components/teacher/results-manager';
import { DatabaseManager } from '@/components/teacher/database-manager';
import { GroupManager } from '@/components/teacher/group-manager';
import { HomeworkManager } from '@/components/teacher/homework-manager';
import { getStudents, Student } from '@/services/students';
import { getGroups, type Group } from '@/services/groups';
import { getAllScores, Score } from '@/services/scores';
import { FullscreenToggle } from '@/components/fullscreen-toggle';
import { BuildInfo } from '@/components/teacher/build-info';
import { getAllWritingEntries, WritingEntry } from '@/services/writing';
import { getAllHomework, type Homework, getHomeworkResultsForUser, HomeworkResult } from '@/services/homework';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';


export default function TeacherDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

   // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [allWritingEntries, setAllWritingEntries] = useState<WritingEntry[]>([]);
  const [allHomework, setAllHomework] = useState<Homework[]>([]);
  const [allHomeworkResults, setAllHomeworkResults] = useState<HomeworkResult[]>([]);
  
  const refreshAllData = useCallback(async () => {
    // This function can be used for a hard refresh if needed, but onSnapshot handles real-time updates.
    // For simplicity, we can leave this logic within useEffect.
  }, []);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('teacher_authenticated') === 'true';
    if (!isAuth) {
      router.replace('/teacher/login');
      return;
    } 
    
    setIsAuthenticated(true);
    setIsLoading(true);
    
    const unsubscribers = [
      onSnapshot(query(collection(db, 'students'), orderBy('name', 'asc')), snapshot => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
        setIsLoading(false);
      }),
      onSnapshot(query(collection(db, 'groups'), orderBy('createdAt', 'asc')), snapshot => {
        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group)));
      }),
      onSnapshot(query(collection(db, 'scores'), orderBy('createdAt', 'desc')), snapshot => {
        setAllScores(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: (doc.data().createdAt as any).toDate().toISOString()
        } as Score)));
      }),
       onSnapshot(query(collection(db, 'writingEntries'), orderBy('createdAt', 'desc')), snapshot => {
        setAllWritingEntries(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: (doc.data().createdAt as any).toDate().toISOString()
        } as WritingEntry)));
      }),
       onSnapshot(query(collection(db, 'homework')), snapshot => {
        setAllHomework(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Homework)));
      }),
       onSnapshot(query(collection(db, 'homeworkResults')), snapshot => {
        setAllHomeworkResults(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
             createdAt: (doc.data().createdAt as any)?.toDate().toISOString()
        } as HomeworkResult)));
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());

  }, [router]);
  
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
      <main className="min-h-screen bg-background p-4 sm:p-8 flex flex-col">
        <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full">
          <Logo />
          <div className="flex items-center gap-4">
              <FullscreenToggle />
              <Button asChild variant="outline">
                  <Link href="/"><Home className="mr-2"/> Accueil Principal</Link>
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2"/> Déconnexion
              </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto mt-4 w-full flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="students">Élèves</TabsTrigger>
                    <TabsTrigger value="groups">Groupes</TabsTrigger>
                    <TabsTrigger value="homework">Devoirs</TabsTrigger>
                    <TabsTrigger value="results">Résultats</TabsTrigger>
                    <TabsTrigger value="database">Réglages</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-6">
                    <StudentManager students={students} />
                </TabsContent>
                <TabsContent value="groups" className="mt-6">
                    <GroupManager initialStudents={students} initialGroups={groups} />
                </TabsContent>
                <TabsContent value="homework" className="mt-6">
                    <HomeworkManager 
                        students={students}
                        groups={groups}
                        allHomework={allHomework}
                        allHomeworkResults={allHomeworkResults}
                    />
                </TabsContent>
                 <TabsContent value="results" className="mt-6">
                    <ResultsManager 
                        students={students} 
                        allScores={allScores} 
                        allWritingEntries={allWritingEntries}
                    />
                </TabsContent>
                 <TabsContent value="database" className="mt-6">
                    <DatabaseManager onDataRefresh={refreshAllData} />
                </TabsContent>
            </Tabs>
          )}
        </div>
         <footer className="max-w-7xl mx-auto w-full pt-8 mt-auto flex justify-end">
            <BuildInfo />
        </footer>
      </main>
    </TooltipProvider>
  );
}
