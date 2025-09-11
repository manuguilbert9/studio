

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { type Student } from '@/services/students';
import { SpellingProgress, SpellingList, SpellingResult } from '@/services/spelling';
import { getHomeworkAssignments, deleteHomeworkAssignment, type HomeworkAssignment } from '@/services/teacher';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSkillBySlug } from '@/lib/skills';
import { Score, hasDoneMathHomework } from '@/services/scores';
import { HomeworkCreator } from './homework-creator';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


interface HomeworkTrackerProps {
    students: Student[];
    spellingLists: SpellingList[];
    allProgress: SpellingProgress[];
    allScores: Score[];
}

export function HomeworkTracker({ students, spellingLists, allProgress, allScores }: HomeworkTrackerProps) {
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [completionStatus, setCompletionStatus] = useState<Record<string, { spellingLundi: boolean, spellingJeudi: boolean, mathLundi: boolean, mathJeudi: boolean }>>({});


    const loadAssignments = async () => {
        setIsLoading(true);
        const fetchedAssignments = await getHomeworkAssignments();
        setAssignments(fetchedAssignments);

        // For each assignment and each student, check completion status
        const newCompletionStatus: Record<string, { spellingLundi: boolean, spellingJeudi: boolean, mathLundi: boolean, mathJeudi: boolean }> = {};
        for (const assignment of fetchedAssignments) {
            for (const student of students) {
                 const spellingProgress = allProgress.find(p => p.userId === student.id)?.progress || {};
                 const isSpellingLundiDone = !!(assignment.spellingListId && spellingProgress[`${assignment.spellingListId.toLowerCase()}-lundi`]);
                 const isSpellingJeudiDone = !!(assignment.spellingListId && spellingProgress[`${assignment.spellingListId.toLowerCase()}-jeudi`]);

                 const isMathLundiDone = assignment.mathSkillSlugLundi ? await hasDoneMathHomework(student.id, assignment.mathSkillSlugLundi, 'lundi') : false;
                 const isMathJeudiDone = assignment.mathSkillSlugJeudi ? await hasDoneMathHomework(student.id, assignment.mathSkillSlugJeudi, 'jeudi') : false;
                
                 newCompletionStatus[`${assignment.id}-${student.id}`] = {
                    spellingLundi: isSpellingLundiDone,
                    spellingJeudi: isSpellingJeudiDone,
                    mathLundi: isMathLundiDone,
                    mathJeudi: isMathJeudiDone,
                 };
            }
        }
        setCompletionStatus(newCompletionStatus);
        setIsLoading(false);
    };

    useEffect(() => {
        loadAssignments();
    }, [students, allProgress, allScores]);
    
    const handleDeleteAssignment = async (id: string) => {
        const result = await deleteHomeworkAssignment(id);
        if (result.success) {
            toast({ title: "Devoirs supprimés", description: "La semaine de devoirs a été retirée."});
            loadAssignments(); // Refresh the list
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer les devoirs."});
        }
    };


    const getStudentCompletionForAssignment = (studentId: string, assignment: HomeworkAssignment): { lundiDone: boolean, jeudiDone: boolean } => {
        const status = completionStatus[`${assignment.id}-${studentId}`];
        if (!status) return { lundiDone: false, jeudiDone: false };
        
        const lundiDone = (!assignment.spellingListId || status.spellingLundi) && (!assignment.mathSkillSlugLundi || status.mathLundi);
        const jeudiDone = (!assignment.spellingListId || status.spellingJeudi) && (!assignment.mathSkillSlugJeudi || status.mathJeudi);
        
        return { lundiDone, jeudiDone };
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Suivi des devoirs</CardTitle>
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
                <CardTitle>Suivi des devoirs par semaine</CardTitle>
                <CardDescription>Programmez les devoirs à l'avance et suivez la progression des élèves pour chaque semaine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <HomeworkCreator spellingLists={spellingLists} onHomeworkAdded={loadAssignments} />
                 
                 <div className="space-y-4">
                     <Accordion type="multiple" className="w-full space-y-4">
                        {assignments.map(assignment => {
                            const spellingList = spellingLists.find(l => l.id === assignment.spellingListId);
                            const mathSkillLundi = getSkillBySlug(assignment.mathSkillSlugLundi || '');
                            const mathSkillJeudi = getSkillBySlug(assignment.mathSkillSlugJeudi || '');
                            
                            const weekDate = parseISO(assignment.weekOf);

                            return (
                                <AccordionItem value={assignment.id} key={assignment.id} className="border bg-secondary/30 rounded-lg px-4">
                                     <div className="flex justify-between items-center w-full">
                                        <AccordionTrigger className="hover:no-underline flex-grow">
                                            <div>
                                                <h3 className="text-lg font-semibold text-left">
                                                    Semaine du {format(weekDate, "d MMMM yyyy", { locale: fr })}
                                                </h3>
                                                <p className="text-xs text-muted-foreground text-left">
                                                    Orthographe: {spellingList ? `${spellingList.id}` : 'Aucun'} | 
                                                    Maths Lundi: {mathSkillLundi?.name || 'Aucun'} | 
                                                    Maths Jeudi: {mathSkillJeudi?.name || 'Aucun'}
                                                </p>
                                            </div>
                                        </AccordionTrigger>
                                        <AlertDialog onOpenChange={(open) => open && event.stopPropagation()}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Supprimer cette semaine de devoirs ?</AlertDialogTitle></AlertDialogHeader>
                                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)}>Supprimer</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Élève</TableHead>
                                                    <TableHead>Devoirs pour Lundi</TableHead>
                                                    <TableHead>Devoirs pour Jeudi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map(student => {
                                                    const { lundiDone, jeudiDone } = getStudentCompletionForAssignment(student.id, assignment);
                                                    return (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="font-medium">{student.name}</TableCell>
                                                        <TableCell>
                                                            {lundiDone ? <CheckCircle className="h-5 w-5 text-green-500" /> : <span className="text-xs text-muted-foreground">Non fait</span>}
                                                        </TableCell>
                                                        <TableCell>
                                                            {jeudiDone ? <CheckCircle className="h-5 w-5 text-green-500" /> : <span className="text-xs text-muted-foreground">Non fait</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                )})}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    );
}
