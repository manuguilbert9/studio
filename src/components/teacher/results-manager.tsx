

'use client';

import { useState, useMemo, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { type Student } from '@/services/students';
import { type Score, deleteScore } from '@/services/scores';
import { getSkillBySlug, difficultyLevelToString, allSkillCategories } from '@/lib/skills';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportGenerator } from './report-generator';
import { cn } from '@/lib/utils';
import type { WritingEntry } from '@/services/writing';
import { SkillProgressChart } from './skill-progress-chart';


interface ResultsManagerProps {
    students: Student[];
    allScores: Score[];
    allWritingEntries: WritingEntry[];
    onDataRefresh: () => void;
}

export function ResultsManager({ students, allScores, allWritingEntries, onDataRefresh }: ResultsManagerProps) {
    const { toast } = useToast();

    const sortedStudents = useMemo(() => {
        const studentLastActivity: Record<string, number> = {};
        allScores.forEach(score => {
            const timestamp = new Date(score.createdAt).getTime();
            if (!studentLastActivity[score.userId] || timestamp > studentLastActivity[score.userId]) {
                studentLastActivity[score.userId] = timestamp;
            }
        });
        allWritingEntries.forEach(entry => {
            const timestamp = new Date(entry.createdAt).getTime();
             if (!studentLastActivity[entry.userId] || timestamp > studentLastActivity[entry.userId]) {
                studentLastActivity[entry.userId] = timestamp;
            }
        });

        return students
            .filter(student => studentLastActivity[student.id]) // Only show students with activity
            .sort((a, b) => (studentLastActivity[b.id] || 0) - (studentLastActivity[a.id] || 0));
    }, [students, allScores, allWritingEntries]);


    const studentData = useMemo(() => {
        const data: Record<string, { scores: Score[], writings: WritingEntry[] }> = {};
        students.forEach(student => {
            data[student.id] = { scores: [], writings: [] };
        });
        allScores.forEach(score => {
            if (data[score.userId]) {
                data[score.userId].scores.push(score);
            }
        });
        allWritingEntries.forEach(entry => {
            if (data[entry.userId]) {
                data[entry.userId].writings.push(entry);
            }
        });
        return data;
    }, [students, allScores, allWritingEntries]);


    const handleDeleteScore = async (scoreId: string) => {
        const result = await deleteScore(scoreId);
        if (result.success) {
            toast({ title: "Résultat supprimé", description: "Le score a été retiré de la base de données." });
            onDataRefresh();
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer le score." });
        }
    };
    
    return (
        <div className="space-y-8">
            <ReportGenerator students={students} allScores={allScores} />
            <Card>
                <CardHeader>
                    <CardTitle>Résultats Détaillés par Élève</CardTitle>
                    <CardDescription>Consultez les graphiques de progression et les résultats pour chaque élève.</CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedStudents.length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {sortedStudents.map(student => {
                            const { scores, writings } = studentData[student.id];
                            const scoresBySkill = scores.reduce((acc, score) => {
                                (acc[score.skill] = acc[score.skill] || []).push(score);
                                return acc;
                            }, {} as Record<string, Score[]>);
                            
                            const skillsByCategory = Object.keys(scoresBySkill).reduce((acc, skillSlug) => {
                                const skill = getSkillBySlug(skillSlug);
                                if (skill) {
                                    (acc[skill.category] = acc[skill.category] || []).push(skillSlug);
                                }
                                return acc;
                            }, {} as Record<string, string[]>);

                            return (
                            <AccordionItem value={student.id} key={student.id} className="border rounded-lg">
                                <AccordionTrigger className="text-lg font-medium px-6 py-4 hover:no-underline">
                                    {student.name}
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 space-y-6">
                                    {Object.keys(skillsByCategory).length > 0 ? (
                                        allSkillCategories.map(category => {
                                            if (!skillsByCategory[category]) return null;
                                            return (
                                                <div key={category}>
                                                    <h4 className="text-md font-semibold mb-3 border-b pb-2">{category}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {skillsByCategory[category].map(skillSlug => (
                                                            <SkillProgressChart
                                                                key={skillSlug}
                                                                skill={getSkillBySlug(skillSlug)!}
                                                                scores={scoresBySkill[skillSlug]}
                                                                onDeleteScore={handleDeleteScore}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                         <p className="text-center text-sm text-muted-foreground py-4">Aucun score d'exercice pour cet élève.</p>
                                    )}

                                    {writings.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold mb-2 mt-4">Cahier d'écriture</h4>
                                            <Accordion type="single" collapsible className="w-full">
                                                {writings.map(entry => (
                                                    <AccordionItem value={entry.id} key={entry.id}>
                                                        <AccordionTrigger>
                                                            {format(new Date(entry.createdAt), "EEEE d MMMM yyyy", { locale: fr })}
                                                        </AccordionTrigger>
                                                        <AccordionContent className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap font-body text-base">
                                                            {entry.text}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )})}
                    </Accordion>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Aucun résultat d'exercice n'a encore été enregistré.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
