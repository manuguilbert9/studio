
'use client';

import { useEffect, useState, FormEvent, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, BarChart3, Home, LogOut, CheckCircle, Circle, UserPlus, Users, AlertTriangle, Star, Check, X, Pencil } from 'lucide-react';
import { Logo } from '@/components/logo';
import { getAllScores, Score } from '@/services/scores';
import { getAllSpellingProgress, getSpellingLists, SpellingList, SpellingProgress, SpellingResult } from '@/services/spelling';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { difficultyLevelToString } from '@/lib/skills';
import { createStudent, getStudents, type Student, updateStudentCode } from '@/services/students';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCurrentSpellingListId, setCurrentSpellingList } from '@/services/teacher';
import { cn } from '@/lib/utils';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [allSpellingProgress, setAllSpellingProgress] = useState<SpellingProgress[]>([]);
  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  // New student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  // Edit student code state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);
  
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
      try {
        const [scoresData, progressData, listsData, studentListData, currentId] = await Promise.all([
          getAllScores(),
          getAllSpellingProgress(),
          getSpellingLists(),
          getStudents(),
          getCurrentSpellingListId(),
        ]);
        
        setAllScores(scoresData);
        setAllSpellingProgress(progressData);
        setSpellingLists(listsData);
        setStudents(studentListData);
        setCurrentListId(currentId);
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
    const isAuthenticated = sessionStorage.getItem('teacher_authenticated') === 'true';
    if (!isAuthenticated) {
      router.replace('/teacher/login');
      return;
    }
    loadDashboardData();
  }, [router, loadDashboardData]);
  
  const studentProgressMap = useMemo(() => {
    const map = new Map<string, Record<string, SpellingResult>>();
    if (allSpellingProgress) {
        allSpellingProgress.forEach(progressItem => {
            if (progressItem.userId && progressItem.progress) {
               map.set(progressItem.userId, progressItem.progress);
            }
        });
    }
    return map;
  }, [allSpellingProgress]);

  const handleSetCurrentList = async (listId: string) => {
    const result = await setCurrentSpellingList(listId);
    if (result.success) {
      setCurrentListId(listId);
      toast({
        title: "Liste actuelle mise à jour",
        description: `La liste ${listId} est maintenant la liste de travail.`,
      });
    } else {
       toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Impossible de définir la liste actuelle.",
      });
    }
  };


  const handleLogout = () => {
    sessionStorage.removeItem('teacher_authenticated');
    router.push('/');
  }

  const handleCreateStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    setIsCreatingStudent(true);
    try {
        const newStudent = await createStudent(newStudentName);
        setStudents(prev => [...prev, newStudent].sort((a,b) => a.name.localeCompare(b.name)));
        toast({
            title: "Élève créé !",
            description: `L'élève ${newStudent.name} a été ajouté avec le code ${newStudent.code}.`,
        });
        setNewStudentName('');
    } catch(error) {
         toast({
            variant: 'destructive',
            title: "Erreur",
            description: "Impossible de créer l'élève.",
        });
    } finally {
        setIsCreatingStudent(false);
    }
  }

  const handleEditCode = (student: Student) => {
    setEditingStudentId(student.id);
    setNewCode(student.code);
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setNewCode('');
  };
  
  const handleUpdateCode = async (studentId: string) => {
    if (newCode.length !== 4 || !/^\d{4}$/.test(newCode)) {
      toast({
        variant: 'destructive',
        title: "Code invalide",
        description: "Le code secret doit être composé de 4 chiffres.",
      });
      return;
    }

    setIsUpdatingCode(true);
    const result = await updateStudentCode(studentId, newCode);
    setIsUpdatingCode(false);

    if (result.success) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, code: newCode } : s));
      toast({
        title: "Code mis à jour",
        description: "Le code secret de l'élève a été modifié.",
      });
      handleCancelEdit();
    } else {
       toast({
        variant: 'destructive',
        title: "Erreur",
        description: result.error || "Impossible de mettre à jour le code.",
      });
    }
  }
  
  if (isLoading) {
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

        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="homework">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students"><Users className="mr-2"/> Gestion des élèves</TabsTrigger>
              <TabsTrigger value="homework"><BookOpen className="mr-2"/> Suivi des devoirs</TabsTrigger>
              <TabsTrigger value="class-results"><BarChart3 className="mr-2"/> Résultats "En classe"</TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                  <Card>
                      <CardHeader>
                          <CardTitle>Créer un nouvel élève</CardTitle>
                          <CardDescription>Ajoutez un élève et un code secret lui sera automatiquement assigné.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <form onSubmit={handleCreateStudent} className="flex items-center gap-4">
                              <Input 
                                  placeholder="Prénom de l'élève" 
                                  value={newStudentName}
                                  onChange={e => setNewStudentName(e.target.value)}
                                  required
                              />
                              <Button type="submit" disabled={isCreatingStudent}>
                                  {isCreatingStudent ? <Loader2 className="animate-spin" /> : <UserPlus />}
                              </Button>
                          </form>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle>Liste des élèves</CardTitle>
                          <CardDescription>Voici la liste de tous les élèves et de leurs codes secrets.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Prénom</TableHead>
                                      <TableHead className="text-right">Code Secret</TableHead>
                                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {students.map(student => (
                                      <TableRow key={student.id}>
                                          <TableCell className="font-medium">{student.name}</TableCell>
                                           <TableCell className="text-right font-mono font-bold">
                                              {editingStudentId === student.id ? (
                                                  <Input 
                                                      type="text" 
                                                      value={newCode}
                                                      onChange={(e) => setNewCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                      maxLength={4}
                                                      className="h-8 w-20 inline-block text-center"
                                                      autoFocus
                                                  />
                                              ) : (
                                                  <span>{student.code}</span>
                                              )}
                                          </TableCell>
                                           <TableCell className="text-right">
                                              {editingStudentId === student.id ? (
                                                  <div className="flex gap-2 justify-end">
                                                      <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateCode(student.id)} disabled={isUpdatingCode}>
                                                          {isUpdatingCode ? <Loader2 className="animate-spin" /> : <Check />}
                                                      </Button>
                                                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                                                          <X />
                                                      </Button>
                                                  </div>
                                              ) : (
                                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditCode(student)}>
                                                      <Pencil />
                                                  </Button>
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
              </div>
            </TabsContent>

            <TabsContent value="homework">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Suivi des devoirs d'orthographe</CardTitle>
                  <CardDescription>Consultez la progression des élèves pour chaque liste de devoirs. Vous pouvez définir la liste actuelle en cliquant sur l'étoile.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold sticky left-0 bg-background z-10">Élève</TableHead>
                        {spellingLists.flatMap(list => [
                          { session: 'Lundi', sessionKey: 'lundi', exerciseId: `${list.id}-lundi`, listData: list },
                          { session: 'Jeudi', sessionKey: 'jeudi', exerciseId: `${list.id}-jeudi`, listData: list }
                        ]).map(({ exerciseId, session, sessionKey, listData }) => {
                          const half = Math.ceil(listData.words.length / 2);
                          const sessionWords = sessionKey === 'lundi' ? listData.words.slice(0, half) : listData.words.slice(half);
                          const wordListString = sessionWords.join(', ');

                          return (
                            <TableHead key={exerciseId} className="text-center">
                               <div className="flex items-center justify-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="cursor-help underline-dashed">{exerciseId.split('-')[0]}<br/>{session}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-center">
                                        <p className="font-normal text-sm text-popover-foreground">{wordListString}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <button onClick={() => handleSetCurrentList(listData.id)}>
                                    <Star className={cn("h-4 w-4 text-muted-foreground/30 hover:text-yellow-400", currentListId === listData.id && "text-yellow-400 fill-yellow-400")}/>
                                </button>
                               </div>
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => {
                          const studentProgress = studentProgressMap.get(student.id);
                          return (
                          <TableRow key={student.id}>
                              <TableCell className="font-semibold sticky left-0 bg-background z-10">{student.name}</TableCell>
                              {spellingLists.flatMap(list => [`${list.id}-lundi`, `${list.id}-jeudi`]).map(exerciseId => {
                                  const result = studentProgress?.[exerciseId.toLowerCase()];
                                  const listId = exerciseId.split('-')[0];
                                  const session = exerciseId.split('-')[1];
                                  const listData = spellingLists.find(l => l.id === listId);
                                  const wordCount = listData ? (session === 'lundi' ? Math.ceil(listData.words.length / 2) : Math.floor(listData.words.length / 2)) : 0;
                                  
                                  return (
                                      <TableCell key={exerciseId} className="text-center">
                                          {!result ? (
                                              <Circle className="text-muted-foreground/30 mx-auto" />
                                          ) : (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center justify-center cursor-help">
                                                    {result.errors.length === 0 ? (
                                                        <CheckCircle className="text-green-500 mx-auto" />
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1.5 text-amber-600 font-bold">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <span>{result.errors.length}</span>
                                                        </div>
                                                    )}
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Fait le : {format(new Date(result.completedAt), 'd MMM yyyy, HH:mm', { locale: fr })}</p>
                                                <p>Erreurs : {result.errors.length > 0 ? `${result.errors.length} / ${wordCount}` : "Aucune"}</p>
                                                {result.errors.length > 0 && (
                                                  <p className="font-semibold text-destructive mt-1">{result.errors.join(', ')}</p>
                                                )}
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                      </TableCell>
                                  );
                              })}
                          </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="class-results">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Résultats des exercices "En classe"</CardTitle>
                  <CardDescription>Voici les derniers scores enregistrés pour tous les élèves.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Élève</TableHead>
                        <TableHead>Compétence</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allScores.map(score => {
                        const studentName = students.find(s => s.id === score.userId)?.name || score.userId;
                        return (
                        <TableRow key={score.id}>
                          <TableCell>{format(new Date(score.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                          <TableCell className="font-medium">{studentName}</TableCell>
                          <TableCell>{score.skill}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {difficultyLevelToString(score.skill, score.calculationSettings, score.currencySettings, score.timeSettings) || 'Standard'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">{score.score.toFixed(0)}%</TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </TooltipProvider>
  );
}
