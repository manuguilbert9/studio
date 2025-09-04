
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
import { Score, hasDoneMathHomework } from '@/services/scores';

interface HomeworkTrackerProps {
    students: Student[];
    spellingLists: SpellingList[];
    allProgress: SpellingProgress[];
    allScores: Score[];
}

export function HomeworkTracker({ students, spellingLists, allProgress, allScores }: HomeworkTrackerProps) {
    const [currentListId, setCurrentListId] = useState<string | null>(null);
    const [currentSkillSlugLundi, setCurrentSkillSlugLundi] = useState<string | null>(null);
    const [currentSkillSlugJeudi, setCurrentSkillSlugJeudi] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [mathLundiDone, setMathLundiDone] = useState<Record<string, boolean>>({});
    const [mathJeudiDone, setMathJeudiDone] = useState<Record<string, boolean>>({});

    const mathSkills = allSkills.filter(s => 
        s.slug !== 'long-calculation' && 
        s.slug !== 'word-families' &&
        s.slug !== 'mental-calculation' && 
        s.slug !== 'spelling' 
    );

    useEffect(() => {
        setIsLoading(true);
        getCurrentHomeworkConfig().then(async ({ listId, skillSlugLundi, skillSlugJeudi }) => {
            setCurrentListId(listId);
            setCurrentSkillSlugLundi(skillSlugLundi);
            setCurrentSkillSlugJeudi(skillSlugJeudi);

            const lundiPromises = students.map(s => 
                skillSlugLundi ? hasDoneMathHomework(s.id, skillSlugLundi, 'lundi') : Promise.resolve(false)
            );
            const jeudiPromises = students.map(s => 
                skillSlugJeudi ? hasDoneMathHomework(s.id, skillSlugJeudi, 'jeudi') : Promise.resolve(false)
            );

            const lundiResults = await Promise.all(lundiPromises);
            const jeudiResults = await Promise.all(jeudiPromises);

            const lundiMap: Record<string, boolean> = {};
            const jeudiMap: Record<string, boolean> = {};

            students.forEach((s, i) => {
                lundiMap[s.id] = lundiResults[i];
                jeudiMap[s.id] = jeudiResults[i];
            });

            setMathLundiDone(lundiMap);
            setMathJeudiDone(jeudiMap);
            setIsLoading(false);
        });
    }, [students]);

    const handleConfigChange = async (type: 'list' | 'skillLundi' | 'skillJeudi', value: string) => {
        const newListId = type === 'list' ? value : currentListId;
        const newSkillSlugLundi = type === 'skillLundi' ? value : currentSkillSlugLundi;
        const newSkillSlugJeudi = type === 'skillJeudi' ? value : currentSkillSlugJeudi;
        
        if (type === 'list') setCurrentListId(value);
        if (type === 'skillLundi') setCurrentSkillSlugLundi(value);
        if (type === 'skillJeudi') setCurrentSkillSlugJeudi(value);
        
        await setCurrentHomeworkConfig(newListId, newSkillSlugLundi, newSkillSlugJeudi);
    };
    
    const progressByStudent = useMemo(() => {
        const map = new Map<string, SpellingProgress>();
        allProgress.forEach(p => map.set(p.userId, p));
        return map;
    }, [allProgress]);

    const getSpellingProgressForSession = (studentId: string, session: 'lundi' | 'jeudi'): SpellingResult | null => {
        if (!currentListId) return null;
        const studentProgress = progressByStudent.get(studentId);
        if (!studentProgress) return null;

        const exerciseId = `${currentListId.toLowerCase()}-${session}`;
        return studentProgress.progress[exerciseId] || null;
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
                <CardDescription>Configurez et suivez la progression des élèves pour les devoirs de la semaine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg bg-secondary/50">
                    <div>
                        <Label htmlFor="spelling-list-select" className="text-sm font-medium text-muted-foreground">
                            Orthographe
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
                        <Label htmlFor="math-skill-lundi-select" className="text-sm font-medium text-muted-foreground">
                            Maths (Lundi)
                        </Label>
                        <Select onValueChange={(val) => handleConfigChange('skillLundi', val)} value={currentSkillSlugLundi || ''}>
                            <SelectTrigger id="math-skill-lundi-select" className="mt-1">
                                <SelectValue placeholder="Choisir un exercice..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mathSkills.map(skill => (
                                    <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="math-skill-jeudi-select" className="text-sm font-medium text-muted-foreground">
                            Maths (Jeudi)
                        </Label>
                        <Select onValueChange={(val) => handleConfigChange('skillJeudi', val)} value={currentSkillSlugJeudi || ''}>
                            <SelectTrigger id="math-skill-jeudi-select" className="mt-1">
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
                            <TableHead>Orthographe</TableHead>
                            <TableHead>Mathématiques</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => {
                            const lundiResult = getSpellingProgressForSession(student.id, 'lundi');
                            const jeudiResult = getSpellingProgressForSession(student.id, 'jeudi');

                            return (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                             <span className="font-semibold text-sm w-12">Lundi:</span>
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
                                            <span className="font-semibold text-sm w-12">Jeudi:</span>
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
                                     <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm w-12">Lundi:</span>
                                            {currentSkillSlugLundi ? (
                                                mathLundiDone[student.id] ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Non fait</span>
                                                )
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm w-12">Jeudi:</span>
                                             {currentSkillSlugJeudi ? (
                                                mathJeudiDone[student.id] ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Non fait</span>
                                                )
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
