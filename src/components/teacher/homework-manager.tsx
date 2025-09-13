

'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { type Group } from '@/services/groups';
import { type Student } from '@/services/students';
import { skills, type Skill } from '@/lib/skills';
import { saveHomework, type Homework, type Assignment, HomeworkResult } from '@/services/homework';
import { getSpellingLists, SpellingList } from '@/services/spelling';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, CheckCircle, XCircle, Users } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface HomeworkManagerProps {
  students: Student[];
  groups: Group[];
  allHomework: Homework[];
  allHomeworkResults: HomeworkResult[];
  onHomeworkChange: () => void;
}

const frenchSkills = skills.filter(s => ['Phonologie', 'Lecture / compréhension', 'Ecriture', 'Grammaire', 'Conjugaison', 'Vocabulaire', 'Orthographe'].includes(s.category));
const mathSkills = skills.filter(s => ['Nombres et calcul', 'Grandeurs et mesures', 'Espace et géométrie'].includes(s.category));


export function HomeworkManager({ students, groups, allHomework, allHomeworkResults, onHomeworkChange }: HomeworkManagerProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  useEffect(() => {
    getSpellingLists().then(lists => {
      setSpellingLists(lists);
      setIsLoadingLists(false);
    });
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateId = format(selectedDate, 'yyyy-MM-dd');
      const existingHomework = allHomework.find(h => h.id === dateId);
      setAssignments(existingHomework?.assignments || {});
    }
  }, [selectedDate, allHomework]);

  const handleAssignmentChange = (groupId: string, type: 'francais' | 'maths' | 'orthographe', skillSlug: string) => {
    setAssignments(prev => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || { francais: null, maths: null, orthographe: null }),
        [type]: skillSlug === 'none' ? null : skillSlug,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    
    const dateId = format(selectedDate, 'yyyy-MM-dd');
    const result = await saveHomework(dateId, assignments);

    if (result.success) {
      toast({ title: 'Devoirs enregistrés', description: 'Les devoirs pour le jour sélectionné ont été mis à jour.' });
      onHomeworkChange();
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer les devoirs." });
    }
    setIsSaving(false);
  };
  
  const getCompletionStatus = (studentId: string, skillSlug: string | null) => {
      if (!skillSlug) return 'not-assigned';
      const dateId = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
      if (!dateId) return 'not-assigned';

      const hasCompleted = allHomeworkResults.some(
          result => result.userId === studentId && result.date === dateId && (result.skillSlug === skillSlug || result.skillSlug.startsWith(skillSlug))
      );
      
      return hasCompleted ? 'completed' : 'pending';
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Choisir la date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={fr}
              showOutsideDays={false}
              className="p-0"
            />
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Assigner les devoirs
            </CardTitle>
            <CardDescription>
              Pour le {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : '...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {groups.length > 0 ? (
                groups.map(group => {
                    const groupStudents = students.filter(s => s.groupId === group.id);
                    const groupAssignment = assignments[group.id] || {};
                    return (
                        <Card key={group.id} className="p-4 bg-secondary/50 overflow-hidden">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2"><Users /> {group.name}</h3>
                             </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Exercice de Français</Label>
                                    <Select
                                        value={groupAssignment.francais || 'none'}
                                        onValueChange={(value) => handleAssignmentChange(group.id, 'francais', value)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Choisir un exercice..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun</SelectItem>
                                            {frenchSkills.map(skill => (
                                                <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Exercice de Mathématiques</Label>
                                    <Select
                                        value={groupAssignment.maths || 'none'}
                                        onValueChange={(value) => handleAssignmentChange(group.id, 'maths', value)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Choisir un exercice..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun</SelectItem>
                                            {mathSkills.map(skill => (
                                                <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2 sm:col-span-2">
                                    <Label>Dictée d'Orthographe</Label>
                                    <Select
                                        value={groupAssignment.orthographe || 'none'}
                                        onValueChange={(value) => handleAssignmentChange(group.id, 'orthographe', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir une liste et une session..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucune</SelectItem>
                                            {spellingLists.map(list => (
                                              <Fragment key={list.id}>
                                                <SelectItem value={`${list.id}-lundi`}>{list.id} (Lundi) - {list.title}</SelectItem>
                                                <SelectItem value={`${list.id}-jeudi`}>{list.id} (Jeudi) - {list.title}</SelectItem>
                                              </Fragment>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {groupStudents.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-semibold mb-2">Statut des élèves</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                        {groupStudents.map(student => {
                                            const francaisStatus = getCompletionStatus(student.id, groupAssignment.francais);
                                            const mathsStatus = getCompletionStatus(student.id, groupAssignment.maths);
                                            const orthoStatus = getCompletionStatus(student.id, groupAssignment.orthographe);
                                            
                                            return (
                                            <div key={student.id} className="flex items-center gap-2 p-2 bg-background rounded-md">
                                                <span className="font-medium flex-grow">{student.name}</span>
                                                <div className="flex gap-1.5">
                                                     <Tooltip>
                                                        <TooltipTrigger>
                                                            {francaisStatus === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600"/> : francaisStatus === 'pending' ? <XCircle className="h-4 w-4 text-red-600"/> : <div className="h-4 w-4"/>}
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Français</p></TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            {mathsStatus === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600"/> : mathsStatus === 'pending' ? <XCircle className="h-4 w-4 text-red-600"/> : <div className="h-4 w-4"/>}
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Maths</p></TooltipContent>
                                                    </Tooltip>
                                                     <Tooltip>
                                                        <TooltipTrigger>
                                                            {orthoStatus === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600"/> : orthoStatus === 'pending' ? <XCircle className="h-4 w-4 text-red-600"/> : <div className="h-4 w-4"/>}
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Orthographe</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )
                })
            ) : (
                <p className="text-center text-muted-foreground py-4">
                    Veuillez d'abord créer des groupes d'élèves.
                </p>
            )}
          </CardContent>
          <CardFooter>
             <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer les devoirs
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
