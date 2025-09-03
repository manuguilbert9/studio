
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle } from 'lucide-react';
import { type Student } from '@/services/students';
import { SpellingProgress, SpellingList, SpellingResult } from '@/services/spelling';
import { setCurrentSpellingList, getCurrentSpellingListId } from '@/services/teacher';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function HomeworkTracker({ students, spellingLists, allProgress }: { 
    students: Student[],
    spellingLists: SpellingList[],
    allProgress: SpellingProgress[] 
}) {
    const { toast } = useToast();
    const [currentListId, setCurrentListId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCurrentSpellingListId().then(id => {
            setCurrentListId(id);
            setIsLoading(false);
        });
    }, []);

    const handleSetCurrentList = async (listId: string) => {
        const result = await setCurrentSpellingList(listId);
        if (result.success) {
            setCurrentListId(listId);
            toast({ title: "Semaine mise à jour", description: `La liste ${listId} est maintenant la liste de devoirs actuelle.` });
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de définir la liste actuelle." });
        }
    };
    
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Suivi des devoirs d'orthographe</CardTitle>
                <CardDescription>Sélectionnez la liste de la semaine et suivez la progression des élèves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Label htmlFor="current-list" className="text-lg">Liste de la semaine :</Label>
                    <Select value={currentListId || ''} onValueChange={handleSetCurrentList}>
                        <SelectTrigger id="current-list" className="w-[200px]">
                            <SelectValue placeholder="Choisir une liste..." />
                        </SelectTrigger>
                        <SelectContent>
                            {spellingLists.map(list => (
                                <SelectItem key={list.id} value={list.id}>{list.id} – {list.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <p className="text-center text-muted-foreground py-8">Veuillez sélectionner une liste pour voir la progression.</p>
                )}
            </CardContent>
        </Card>
    );
}

