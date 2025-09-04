
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, BookOpen, Calculator } from 'lucide-react';
import { type Student } from '@/services/students';
import { SpellingProgress, SpellingList, SpellingResult } from '@/services/spelling';
import { getCurrentHomeworkConfig, setCurrentHomeworkConfig } from '@/services/teacher';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { skills as allSkills, getSkillBySlug } from '@/lib/skills';
import { Score } from '@/services/scores';

interface HomeworkTrackerProps {
    students: Student[];
    spellingLists: SpellingList[];
    allProgress: SpellingProgress[];
    allScores: Score[];
}

export function HomeworkTracker({ students, spellingLists, allProgress, allScores }: HomeworkTrackerProps) {
    const [currentListId, setCurrentListId] = useState<string | null>(null);
    const [currentSkillSlug, setCurrentSkillSlug] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const mathSkills = allSkills.filter(s => 
        s.slug !== 'long-calculation' && 
        s.slug !== 'word-families' &&
        s.slug !== 'mental-calculation' && // Exclude for now
        s.slug !== 'spelling' // This is an example, assuming 'spelling' is not a math skill
    );


    useEffect(() => {
        getCurrentHomeworkConfig().then(({ listId, skillSlug }) => {
            setCurrentListId(listId);
            setCurrentSkillSlug(skillSlug);
            setIsLoading(false);
        });
    }, []);

    const handleConfigChange = async (type: 'list' | 'skill', value: string) => {
        const newListId = type === 'list' ? value : currentListId;
        const newSkillSlug = type === 'skill' ? value : currentSkillSlug;
        
        if (type === 'list') setCurrentListId(value);
        if (type === 'skill') setCurrentSkillSlug(value);
        
        await setCurrentHomeworkConfig(newListId, newSkillSlug);
    };
    
    const progressByStudent = useMemo(() => {
        const map = new Map<string, SpellingProgress>();
        allProgress.forEach(p => map.set(p.userId, p));
        return map;
    }, [allProgress]);
    
    const scoresByStudent = useMemo(() => {
        const map = new Map<string, Score[]>();
        allScores.forEach(score => {
            if (!map.has(score.userId)) {
                map.set(score.userId, []);
            }
            map.get(score.userId)!.push(score);
        });
        return map;
    }, [allScores]);


    const getSpellingProgressForSession = (studentId: string, session: 'lundi' | 'jeudi'): SpellingResult | null => {
        if (!currentListId) return null;
        const studentProgress = progressByStudent.get(studentId);
        if (!studentProgress) return null;

        const exerciseId = `${currentListId.toLowerCase()}-${session}`;
        return studentProgress.progress[exerciseId] || null;
    };
    
    const hasDoneMathExercise = (studentId: string): boolean => {
        if (!currentSkillSlug) return false;
        const studentScores = scoresByStudent.get(studentId) || [];
        return studentScores.some(score => score.skill === currentSkillSlug);
    };

    
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
                <CardTitle>Suivi des devoirs</CardTitle>
                <CardDescription>Suivez la progression des élèves pour les devoirs de la semaine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-secondary/50">
                    <div>
                        <Label htmlFor="spelling-list-select" className="text-sm font-medium text-muted-foreground">
                            Liste d'orthographe de la semaine
                        </Label>
                        <Select onValueChange={(val) => handleConfigChange('list', val)} value={currentListId || ''}>
                            <SelectTrigger id="spelling-list-select" className="mt-1">
                                <SelectValue placeholder="Choisir une liste..." />
                            </SelectTrigger>
                            <SelectContent>
                                {spellingLists.map(list => (
                                    <SelectItem key={list.id} value={list.id}>{list.id} – {list.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="math-skill-select" className="text-sm font-medium text-muted-foreground">
                            Exercice de maths de la semaine
                        </Label>
                        <Select onValueChange={(val) => handleConfigChange('skill', val)} value={currentSkillSlug || ''}>
                            <SelectTrigger id="math-skill-select" className="mt-1">
                                <SelectValue placeholder="Choisir un exercice..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mathSkills.map(skill => (
                                    <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Élève</TableHead>
                            <TableHead>Devoirs d'orthographe</TableHead>
                            <TableHead>Exercice de maths</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => {
                            const lundiResult = getSpellingProgressForSession(student.id, 'lundi');
                            const jeudiResult = getSpellingProgressForSession(student.id, 'jeudi');
                            const mathDone = hasDoneMathExercise(student.id);

                            return (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                             <span className="font-semibold text-sm">Lundi:</span>
                                             {lundiResult ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div><CheckCircle className="h-5 w-5 text-green-500 cursor-pointer" /></div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Terminé le {format(new Date(lundiResult.completedAt), 'd MMM yyyy', { locale: fr })}</p>
                                                        {lundiResult.errors.length > 0 && <p>Erreurs: {lundiResult.errors.join(', ')}</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Non fait</span>
                                            )}
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">Jeudi:</span>
                                             {jeudiResult ? (
                                                 <Tooltip>
                                                    <TooltipTrigger asChild>
                                                         <div><CheckCircle className="h-5 w-5 text-green-500 cursor-pointer" /></div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Terminé le {format(new Date(jeudiResult.completedAt), 'd MMM yyyy', { locale: fr })}</p>
                                                        {jeudiResult.errors.length > 0 && <p>Erreurs: {jeudiResult.errors.join(', ')}</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Non fait</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {currentSkillSlug ? (
                                         mathDone ? (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                    <span className="text-xs text-muted-foreground">Fait</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Non fait</span>
                                            )
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Aucun assigné</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
