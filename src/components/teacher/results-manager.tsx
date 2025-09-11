

'use client';

import { useState, useMemo, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { type Student } from '@/services/students';
import { type Score, deleteScore, CalculationState } from '@/services/scores';
import { getSkillBySlug, difficultyLevelToString } from '@/lib/skills';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportGenerator } from './report-generator';
import { cn } from '@/lib/utils';
import { AdditionWidget } from '../tableau/addition-widget';
import { SoustractionWidget } from '../tableau/soustraction-widget';
import type { WritingEntry } from '@/services/writing';

interface ResultsManagerProps {
    students: Student[];
    allScores: Score[];
    allWritingEntries: WritingEntry[];
    onDataRefresh: () => void;
}

const ReadOnlyCalculationWidget = ({ score }: { score: Score }) => {
    if (!score.calculationState) return null;

    const operands = score.details
        ?.find(d => d.calculationState)
        ?.question.split(/[+-]/).map(s => parseInt(s.trim(), 10)) || [];
    
    if (operands.length < 2) return null;

    const operation = score.details?.find(d => d.calculationState)?.question.includes('+') ? 'addition' : 'subtraction';

    if (operation === 'addition') {
        return <AdditionWidget isExercise={true} operands={operands} calculationState={score.calculationState} feedback="correct"/>;
    }
    
    if (operation === 'subtraction') {
        return <SoustractionWidget isExercise={true} operands={operands} calculationState={score.calculationState} feedback="correct" />;
    }

    return null;
}


export function ResultsManager({ students, allScores, allWritingEntries, onDataRefresh }: ResultsManagerProps) {
    const { toast } = useToast();
    const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);


    const scoresByStudent = useMemo(() => {
        const map = new Map<string, Score[]>();
        students.forEach(student => map.set(student.id, []));
        allScores.forEach(score => {
            if (map.has(score.userId)) {
                map.get(score.userId)!.push(score);
            }
        });
        // Sort scores by date for each student
        map.forEach((scores, studentId) => {
            map.set(studentId, scores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
        return map;
    }, [students, allScores]);

    const writingByStudent = useMemo(() => {
        const map = new Map<string, WritingEntry[]>();
        students.forEach(student => map.set(student.id, []));
        allWritingEntries.forEach(entry => {
            if (map.has(entry.userId)) {
                map.get(entry.userId)!.push(entry);
            }
        });
         map.forEach((entries, studentId) => {
            map.set(studentId, entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
        return map;
    }, [students, allWritingEntries]);

    const handleDeleteScore = async (scoreId: string) => {
        const result = await deleteScore(scoreId);
        if (result.success) {
            toast({ title: "Résultat supprimé", description: "Le score a été retiré de la base de données." });
            onDataRefresh();
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer le score." });
        }
    };
    
    const studentsWithActivity = students.filter(student => 
        (scoresByStudent.get(student.id) || []).length > 0 || 
        (writingByStudent.get(student.id) || []).length > 0
    );

    const shouldShowCorrectAnswer = (skillSlug: string) => {
        const skillsWithoutCorrectAnswer = ['simple-word-reading', 'ecoute-les-nombres', 'nombres-complexes', 'lire-les-nombres'];
        return !skillsWithoutCorrectAnswer.includes(skillSlug);
    };

    const hasOptionsColumn = (score: Score) => score.details?.some(d => d.options && d.options.length > 0);
    const hasMistakesColumn = (score: Score) => score.details?.some(d => d.mistakes && d.mistakes.length > 0);

    return (
        <div className="space-y-8">
            <ReportGenerator students={students} allScores={allScores} />
            <Card>
                <CardHeader>
                    <CardTitle>Résultats Détaillés par Élève</CardTitle>
                    <CardDescription>Consultez et gérez tous les scores et textes enregistrés pour chaque élève.</CardDescription>
                </CardHeader>
                <CardContent>
                    {studentsWithActivity.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                        {studentsWithActivity.map(student => {
                            const studentScores = scoresByStudent.get(student.id) || [];
                            const studentWritings = writingByStudent.get(student.id) || [];
                            return (
                            <AccordionItem value={student.id} key={student.id}>
                                <AccordionTrigger className="text-lg font-medium">{student.name}</AccordionTrigger>
                                <AccordionContent className="space-y-6">
                                    {studentScores.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold mb-2">Scores des exercices</h4>
                                             <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Exercice</TableHead>
                                                        <TableHead>Score</TableHead>
                                                        <TableHead>Niveau</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                {studentScores.map(score => (
                                                    <Fragment key={score.id}>
                                                        <TableRow>
                                                            <TableCell className="font-medium">{getSkillBySlug(score.skill)?.name || score.skill}</TableCell>
                                                            <TableCell>{score.skill === 'reading-race' ? `${score.score} MCLM` : `${Math.round(score.score)} %`}</TableCell>
                                                            <TableCell>{difficultyLevelToString(score.skill, score.score, score.calculationSettings, score.currencySettings, score.timeSettings, score.calendarSettings, score.numberLevelSettings, score.countSettings, score.readingRaceSettings)}</TableCell>
                                                            <TableCell>{format(new Date(score.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex gap-1 justify-end items-center">
                                                                    {score.details && score.details.length > 0 && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => setExpandedScoreId(prev => prev === score.id ? null : score.id)}
                                                                        >
                                                                            Détail
                                                                            {expandedScoreId === score.id ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                                                        </Button>
                                                                    )}
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
                                                                                Cette action est irréversible. Le score pour l'exercice "{getSkillBySlug(score.skill)?.name}" sera définitivement supprimé.
                                                                            </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleDeleteScore(score.id)} className="bg-destructive hover:bg-destructive/90">
                                                                                Supprimer
                                                                            </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                        {expandedScoreId === score.id && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="p-0">
                                                                    <div className="p-4 bg-secondary/50">
                                                                        <h4 className="font-semibold mb-2">Détail de la session</h4>
                                                                        {score.skill === 'long-calculation' ? (
                                                                            score.details?.map((detail, index) => (
                                                                                <div key={index} className="mb-4 p-4 border rounded-lg bg-background">
                                                                                    <p>Calcul: <span className="font-mono">{detail.question}</span></p>
                                                                                    <p>Réponse attendue: <span className="font-mono">{detail.correctAnswer}</span></p>
                                                                                    <div className="flex justify-center items-center mt-2 scale-75 transform -translate-x-12">
                                                                                        <ReadOnlyCalculationWidget score={{...score, calculationState: detail.calculationState}} />
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : score.skill === 'reading-race' && score.details?.[0] ? (
                                                                            <div className="p-2">
                                                                                <p><span className="font-semibold">Texte Lu:</span> {score.details[0].question}</p>
                                                                                <p><span className="font-semibold">Mots mal lus ou manqués:</span> {score.details[0]?.mistakes?.join(', ') || 'Aucun'}</p>
                                                                            </div>
                                                                        ) : (
                                                                            <Table>
                                                                                <TableHeader>
                                                                                    <TableRow>
                                                                                        <TableHead>Question</TableHead>
                                                                                        <TableHead>Réponse</TableHead>
                                                                                        {hasOptionsColumn(score) && <TableHead>Options proposées</TableHead>}
                                                                                        {shouldShowCorrectAnswer(score.skill) && <TableHead>Bonne réponse</TableHead>}
                                                                                        {hasMistakesColumn(score) && <TableHead>Erreurs</TableHead>}
                                                                                        <TableHead>Statut</TableHead>
                                                                                    </TableRow>
                                                                                </TableHeader>
                                                                                <TableBody>
                                                                                    {score.details?.map((detail, index) => (
                                                                                        <TableRow key={index} className={cn(detail.status === 'incorrect' && 'bg-red-100/50')}>
                                                                                            <TableCell className="text-xs sm:text-sm">{detail.question}</TableCell>
                                                                                            <TableCell className={cn("font-medium", detail.status === 'incorrect' && 'text-destructive')}>{detail.userAnswer}</TableCell>
                                                                                            {hasOptionsColumn(score) && <TableCell className="text-xs text-muted-foreground">{detail.options?.join(', ') || '-'}</TableCell>}
                                                                                            {shouldShowCorrectAnswer(score.skill) && <TableCell className="font-medium text-green-700">{detail.correctAnswer}</TableCell>}
                                                                                            {hasMistakesColumn(score) && <TableCell className="text-xs text-muted-foreground">{detail.mistakes?.join(', ') || '-'}</TableCell>}
                                                                                            <TableCell>
                                                                                                {detail.status === 'correct' ?
                                                                                                    <CheckCircle className="h-5 w-5 text-green-600" /> :
                                                                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                                                                }
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </Fragment>
                                                ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {studentWritings.length > 0 && (
                                        <div>
                                            <h4 className="text-md font-semibold mb-2 mt-4">Cahier d'écriture</h4>
                                            <Accordion type="single" collapsible className="w-full">
                                                {studentWritings.map(entry => (
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

                                    {studentScores.length === 0 && studentWritings.length === 0 && (
                                         <p className="text-center text-sm text-muted-foreground py-4">Aucune activité enregistrée pour cet élève.</p>
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
