
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle } from 'lucide-react';
import { type Student } from '@/services/students';
import { SpellingProgress, SpellingList, SpellingResult } from '@/services/spelling';
import { getCurrentSpellingListId } from '@/services/teacher';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function HomeworkTracker({ students, spellingLists, allProgress }: { 
    students: Student[],
    spellingLists: SpellingList[],
    allProgress: SpellingProgress[] 
}) {
    const [currentListId, setCurrentListId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCurrentSpellingListId().then(id => {
            setCurrentListId(id);
            setIsLoading(false);
        });
    }, []);
    
    const progressByStudent = useMemo(() => {
        const map = new Map<string, SpellingProgress>();
        allProgress.forEach(p => map.set(p.userId, p));
        return map;
    }, [allProgress]);

    const getStudentProgressForList = (studentId: string, session: 'lundi' | 'jeudi'): SpellingResult | null => {
        if (!currentListId) return null;
        const studentProgress = progressByStudent.get(studentId);
        if (!studentProgress) return null;

        const exerciseId = `${currentListId.toLowerCase()}-${session}`;
        return studentProgress.progress[exerciseId] || null;
    }
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Suivi des devoirs d'orthographe</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-8">
                     <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }
    
    const currentListDetails = spellingLists.find(l => l.id === currentListId);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Suivi des devoirs d'orthographe</CardTitle>
                <CardDescription>Suivez la progression des élèves pour la liste de devoirs de la semaine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-muted-foreground">Liste de la semaine actuelle :</p>
                    {currentListDetails ? (
                         <p className="text-xl font-bold">{currentListDetails.id} – {currentListDetails.title}</p>
                    ) : (
                        <p className="text-xl font-bold">Aucune</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                        Pour modifier, éditez le fichier `src/data/teacher-settings.json`.
                    </p>
                </div>
                
                 {currentListId ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Élève</TableHead>
                                <TableHead>Devoirs de Lundi</TableHead>
                                <TableHead>Devoirs de Jeudi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => {
                                const lundiResult = getStudentProgressForList(student.id, 'lundi');
                                const jeudiResult = getStudentProgressForList(student.id, 'jeudi');

                                return (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>
                                        {lundiResult ? (
                                             <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="text-xs text-muted-foreground cursor-default">
                                                            {lundiResult.errors.length} erreur(s)
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Terminé le {format(new Date(lundiResult.completedAt), 'd MMM yyyy', { locale: fr })}</p>
                                                        {lundiResult.errors.length > 0 && <p>Erreurs: {lundiResult.errors.join(', ')}</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Non fait</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {jeudiResult ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="text-xs text-muted-foreground cursor-default">
                                                            {jeudiResult.errors.length} erreur(s)
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Terminé le {format(new Date(jeudiResult.completedAt), 'd MMM yyyy', { locale: fr })}</p>
                                                        {jeudiResult.errors.length > 0 && <p>Erreurs: {jeudiResult.errors.join(', ')}</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Non fait</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-8">Veuillez sélectionner une liste dans le fichier de configuration pour voir la progression.</p>
                )}
            </CardContent>
        </Card>
    );
}
