
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { type Group } from '@/services/groups';
import { skills, type Skill } from '@/lib/skills';
import { saveHomework, type Homework, type Assignment } from '@/services/homework';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface HomeworkManagerProps {
  groups: Group[];
  allHomework: Homework[];
  onHomeworkChange: () => void;
}

const frenchSkills = skills.filter(s => ['Phonologie', 'Lecture / compréhension', 'Ecriture', 'Orthographe', 'Grammaire', 'Conjugaison', 'Vocabulaire'].includes(s.category));
const mathSkills = skills.filter(s => ['Nombres et calcul', 'Grandeurs et mesures', 'Espace et géométrie'].includes(s.category));


export function HomeworkManager({ groups, allHomework, onHomeworkChange }: HomeworkManagerProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      const dateId = selectedDate.toISOString().split('T')[0];
      const existingHomework = allHomework.find(h => h.id === dateId);
      setAssignments(existingHomework?.assignments || {});
    }
  }, [selectedDate, allHomework]);

  const handleAssignmentChange = (groupId: string, type: 'francais' | 'maths', skillSlug: string) => {
    setAssignments(prev => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || { francais: null, maths: null }),
        [type]: skillSlug === 'none' ? null : skillSlug,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    
    const dateId = selectedDate.toISOString().split('T')[0];
    const result = await saveHomework(dateId, assignments);

    if (result.success) {
      toast({ title: 'Devoirs enregistrés', description: 'Les devoirs pour le jour sélectionné ont été mis à jour.' });
      onHomeworkChange();
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'enregistrer les devoirs." });
    }
    setIsSaving(false);
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
                groups.map(group => (
                    <Card key={group.id} className="p-4 bg-secondary/50">
                        <h3 className="font-bold text-lg mb-4">{group.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Exercice de Français</Label>
                                <Select
                                    value={assignments[group.id]?.francais || 'none'}
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
                                    value={assignments[group.id]?.maths || 'none'}
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
                        </div>
                    </Card>
                ))
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
