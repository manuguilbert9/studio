
'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Home, CheckCircle, List, BookOpen, Calculator } from 'lucide-react';
import { getSpellingLists, getSpellingProgress, SpellingList, SpellingProgress } from '@/services/spelling';
import { UserContext } from '@/context/user-context';
import { getCurrentHomeworkConfig, HomeworkAssignment } from '@/services/teacher';
import { getSkillBySlug } from '@/lib/skills';
import { getScoresForUser, hasDoneMathHomework, Score } from '@/services/scores';
import { addDays, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HomeworkListProps {
  initialHomeworkConfig: { listId: string | null, skillSlugLundi: string | null, skillSlugJeudi: string | null, weekOf: string | null };
  initialSpellingLists: SpellingList[];
  allSpellingProgress: SpellingProgress[];
  allScores: Score[];
}

// This is the new Client Component that handles the display logic
export function HomeworkList({ initialHomeworkConfig, initialSpellingLists, allSpellingProgress, allScores }: HomeworkListProps) {
  const router = useRouter();
  const { student, isLoading: isUserLoading } = useContext(UserContext);

  const [studentProgress, setStudentProgress] = useState<Record<string, boolean>>({});
  const [currentHomework, setCurrentHomework] = useState(initialHomeworkConfig);
  const [isMathLundiDone, setIsMathLundiDone] = useState(false);
  const [isMathJeudiDone, setIsMathJeudiDone] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function processStudentData() {
      if (!student) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      // 1. Determine final homework config, considering overrides
      const studentOverrides = student.homeworkOverrides || {};
      const currentWeekKey = initialHomeworkConfig.weekOf;
      let finalHomework = initialHomeworkConfig;

      if (currentWeekKey && studentOverrides[currentWeekKey]) {
        const studentHomework = studentOverrides[currentWeekKey];
        const isOverrideValid = studentHomework.spellingListId !== null || studentHomework.mathSkillSlugLundi !== null || studentHomework.mathSkillSlugJeudi !== null;
        if(isOverrideValid) {
            finalHomework = { 
                ...initialHomeworkConfig,
                ...studentHomework
            };
        }
      }
      setCurrentHomework(finalHomework);

      // 2. Filter progress for the current student
      const studentSpellingProgress = allSpellingProgress.find(p => p.userId === student.id)?.progress || {};
      const simplifiedProgress: Record<string, boolean> = {};
      for (const key in studentSpellingProgress) {
          simplifiedProgress[key] = true;
      }
      setStudentProgress(simplifiedProgress);

      // 3. Filter math homework status for the current student
      const studentScores = allScores.filter(s => s.userId === student.id);

      const checkMathHomework = (skillSlug: string | null, session: 'lundi' | 'jeudi'): boolean => {
        if (!skillSlug) return false;
        return studentScores.some(score => score.skill === skillSlug && score.homeworkSession === session);
      };

      setIsMathLundiDone(checkMathHomework(finalHomework.skillSlugLundi, 'lundi'));
      setIsMathJeudiDone(checkMathHomework(finalHomework.skillSlugJeudi, 'jeudi'));
      
      setIsLoading(false);
    }
    
    if (!isUserLoading) {
      processStudentData();
    }
  }, [student, isUserLoading, initialHomeworkConfig, allSpellingProgress, allScores]);
  
  if (isLoading || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des devoirs...</p>
      </div>
    );
  }
  
  if (!student) {
    return (
      <Card className="w-full text-center p-8">
        <CardTitle>Veuillez vous connecter</CardTitle>
        <CardContent>
          <p className='mt-4'>Vous devez être connecté pour voir les devoirs.</p>
          <Button asChild className="mt-4">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const currentList = initialSpellingLists.find(list => list.id === currentHomework?.listId);
  const mathSkillLundi = getSkillBySlug(currentHomework?.skillSlugLundi || '');
  const mathSkillJeudi = getSkillBySlug(currentHomework?.skillSlugJeudi || '');
  
  const hasHomeworkForLundi = !!(currentList || mathSkillLundi);
  const hasHomeworkForJeudi = !!(currentList || mathSkillJeudi);

  const getWeekDayDate = (day: 'lundi' | 'jeudi'): string => {
    if (!currentHomework?.weekOf) return '';
    try {
        const monday = parseISO(currentHomework.weekOf);
        const targetDay = addDays(monday, day === 'lundi' ? 0 : 3);
        return format(targetDay, 'd/MM');
    } catch (e) {
        console.error("Date formatting error:", e);
        return '';
    }
  }
  
  const weekOfDate = currentHomework?.weekOf ? parseISO(currentHomework.weekOf) : null;

  return (
    <div className="space-y-8">
        <Card className="w-full bg-secondary/50 border-primary/50">
            <CardHeader>
                <CardTitle className="font-headline text-3xl sm:text-4xl text-center">
                    Devoirs de la semaine du {weekOfDate ? format(weekOfDate, 'd MMMM', {locale: fr}) : ''}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lundi Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Pour Lundi {weekOfDate && <span className="font-sans font-normal text-muted-foreground">{getWeekDayDate('lundi')}</span>}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentList && (
                            <Button 
                                variant={studentProgress[`${currentList.id}-lundi`] ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/devoirs/${currentList.id}-lundi`)}
                            >
                                <span className="flex items-center gap-2"><BookOpen className="h-5 w-5"/>Orthographe: {currentList.id}</span>
                                {studentProgress[`${currentList.id}-lundi`] && <CheckCircle className="text-green-500"/>}
                            </Button>
                        )}
                         {mathSkillLundi ? (
                            <Button 
                                variant={isMathLundiDone ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/exercise/${mathSkillLundi.slug}?homework=lundi`)}
                            >
                                <span className="flex items-center gap-2"><Calculator className="h-5 w-5"/>Maths: {mathSkillLundi.name}</span>
                                {isMathLundiDone && <CheckCircle className="text-green-500"/>}
                            </Button>
                        ) : null}
                         {!hasHomeworkForLundi && <div className="text-center text-sm text-muted-foreground p-4">Aucun devoir pour lundi.</div>}
                    </CardContent>
                </Card>

                 {/* Jeudi Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Pour Jeudi {weekOfDate && <span className="font-sans font-normal text-muted-foreground">{getWeekDayDate('jeudi')}</span>}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentList && (
                           <Button 
                                variant={studentProgress[`${currentList.id}-jeudi`] ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/devoirs/${currentList.id}-jeudi`)}
                            >
                                <span className="flex items-center gap-2"><BookOpen className="h-5 w-5"/>Orthographe: {currentList.id}</span>
                                {studentProgress[`${currentList.id}-jeudi`] && <CheckCircle className="text-green-500"/>}
                            </Button>
                        )}
                        {mathSkillJeudi ? (
                             <Button 
                                variant={isMathJeudiDone ? "secondary" : "default"} 
                                className="w-full h-14 text-base justify-between"
                                onClick={() => router.push(`/exercise/${mathSkillJeudi.slug}?homework=jeudi`)}
                            >
                                <span className="flex items-center gap-2"><Calculator className="h-5 w-5"/>Maths: {mathSkillJeudi.name}</span>
                                {isMathJeudiDone && <CheckCircle className="text-green-500"/>}
                            </Button>
                        ) : null}
                         {!hasHomeworkForJeudi && <div className="text-center text-sm text-muted-foreground p-4">Aucun devoir pour jeudi.</div>}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

        <Card className="w-full">
        <CardHeader>
            <CardTitle className="font-headline text-3xl sm:text-4xl text-center flex items-center justify-center gap-4">
                <List /> Toutes les listes d'orthographe
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {initialSpellingLists.map(list => (
                <Card key={list.id} className="p-4">
                <h3 className="font-headline text-xl mb-2">{list.id} – {list.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                    { session: 'Lundi', exerciseId: `${list.id}-lundi` },
                    { session: 'Jeudi', exerciseId: `${list.id}-jeudi` }
                    ].map(({ session, exerciseId }) => {
                    const isCompleted = studentProgress[exerciseId.toLowerCase()] || false;
                    return (
                        <Button 
                            key={exerciseId} 
                            variant={isCompleted ? "secondary" : "default"} 
                            className="h-14 text-base justify-between"
                            onClick={() => router.push(`/devoirs/${exerciseId}`)}
                        >
                            <span>{list.id} : {session}</span>
                            {isCompleted && <CheckCircle className="text-green-500"/>}
                        </Button>
                    )
                    })}
                </div>
                </Card>
            ))}
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
