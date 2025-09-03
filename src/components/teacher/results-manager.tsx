
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { type Student } from '@/services/students';
import { type Score, deleteScore } from '@/services/scores';
import { getSkillBySlug, difficultyLevelToString } from '@/lib/skills';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ResultsManagerProps {
    students: Student[];
    allScores: Score[];
    onDataRefresh: () => void;
}

export function ResultsManager({ students, allScores, onDataRefresh }: ResultsManagerProps) {
    const { toast } = useToast();

    const scoresByStudent = useMemo(() => {
        const map = new Map<string, Score[]>();
        students.forEach(student => map.set(student.id, []));
        allScores.forEach(score => {
            if (map.has(score.userId)) {
                map.get(score.userId)!.push(score);
            }
        });
        return map;
    }, [students, allScores]);

    const handleDeleteScore = async (scoreId: string) => {
        const result = await deleteScore(scoreId);
        if (result.success) {
            toast({ title: "Résultat supprimé", description: "Le score a été retiré de la base de données." });
            onDataRefresh();
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer le score." });
        }
    };
    
    const studentsWithScores = students.filter(student => scoresByStudent.get(student.id)?.length > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Résultats des élèves</CardTitle>
                <CardDescription>Consultez et gérez tous les scores enregistrés pour chaque élève.</CardDescription>
            </CardHeader>
            <CardContent>
                {studentsWithScores.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                    {studentsWithScores.map(student => {
                        const studentScores = scoresByStudent.get(student.id) || [];
                        return (
                        <AccordionItem value={student.id} key={student.id}>
                            <AccordionTrigger className="text-lg font-medium">{student.name} ({studentScores.length} résultat(s))</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exercice</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Niveau</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {studentScores.map(score => (
                                        <TableRow key={score.id}>
                                            <TableCell className="font-medium">{getSkillBySlug(score.skill)?.name || score.skill}</TableCell>
                                            <TableCell>{Math.round(score.score)} %</TableCell>
                                            <TableCell>{difficultyLevelToString(score.skill, score.calculationSettings, score.currencySettings, score.timeSettings) || 'Standard'}</TableCell>
                                            <TableCell>{format(new Date(score.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                                            <TableCell className="text-right">
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                            <Trash2 />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer ce résultat ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible. Le score de {Math.round(score.score)}% pour l'exercice "{getSkillBySlug(score.skill)?.name}" sera définitivement supprimé.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteScore(score.id)}>
                                                            Supprimer
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    )})}
                </Accordion>
                ) : (
                     <p className="text-center text-muted-foreground py-8">Aucun résultat d'exercice n'a encore été enregistré.</p>
                )}
            </CardContent>
        </Card>
    );
}
