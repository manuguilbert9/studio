
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '../ui/label';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { skills as allSkills } from '@/lib/skills';
import type { SpellingList } from '@/services/spelling';
import { addHomeworkAssignment } from '@/services/teacher';
import { useToast } from '@/hooks/use-toast';


interface HomeworkCreatorProps {
    spellingLists: SpellingList[];
    onHomeworkAdded: () => void;
}

// Filter skills appropriate for homework assignments
const mathSkills = allSkills.filter(s => 
    s.category === 'Nombres et calcul' || 
    s.category === 'Grandeurs et mesures' ||
    s.category === 'Problèmes'
);

export function HomeworkCreator({ spellingLists, onHomeworkAdded }: HomeworkCreatorProps) {
    const { toast } = useToast();
    const [week, setWeek] = useState<Date | undefined>(undefined);
    const [spellingListId, setSpellingListId] = useState<string | null>(null);
    const [mathSkillLundi, setMathSkillLundi] = useState<string | null>(null);
    const [mathSkillJeudi, setMathSkillJeudi] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddHomework = async () => {
        if (!week) {
            toast({ variant: 'destructive', title: "Veuillez choisir une semaine."});
            return;
        }

        setIsSaving(true);
        const monday = startOfWeek(week, { weekStartsOn: 1 });
        const result = await addHomeworkAssignment({
            weekOf: monday.toISOString().split('T')[0] + 'T00:00:00.000Z',
            spellingListId,
            mathSkillSlugLundi: mathSkillLundi,
            mathSkillSlugJeudi: mathSkillJeudi
        });

        if (result.success) {
            toast({ title: "Devoirs ajoutés", description: `Les devoirs pour la semaine du ${format(monday, 'd MMMM', {locale: fr})} ont été programmés.`});
            onHomeworkAdded(); // Refresh parent component
            // Reset form
            setWeek(undefined);
            setSpellingListId(null);
            setMathSkillLundi(null);
            setMathSkillJeudi(null);
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'ajouter les devoirs."});
        }
        setIsSaving(false);
    }

    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle>Programmer une nouvelle semaine de devoirs</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                 <div className="grid gap-1.5">
                    <Label htmlFor="week-select">Semaine</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="week-select"
                                variant={"outline"}
                                className={cn("justify-start text-left font-normal", !week && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {week ? `Sem. du ${format(startOfWeek(week, {weekStartsOn: 1}), "d LLL", {locale: fr})}` : <span>Choisir une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={week}
                                onSelect={setWeek}
                                initialFocus
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="spelling-select">Orthographe</Label>
                     <Select onValueChange={(val) => setSpellingListId(val === 'null' ? null : val)} value={spellingListId || ''}>
                        <SelectTrigger id="spelling-select">
                            <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="null">Aucun</SelectItem>
                            {spellingLists.map(list => (
                                <SelectItem key={list.id} value={list.id}>{list.id}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="math-lundi-select">Maths Lundi</Label>
                     <Select onValueChange={(val) => setMathSkillLundi(val === 'null' ? null : val)} value={mathSkillLundi || ''}>
                        <SelectTrigger id="math-lundi-select">
                            <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="null">Aucun</SelectItem>
                            {mathSkills.map(skill => (
                                <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="math-jeudi-select">Maths Jeudi</Label>
                     <Select onValueChange={(val) => setMathSkillJeudi(val === 'null' ? null : val)} value={mathSkillJeudi || ''}>
                        <SelectTrigger id="math-jeudi-select">
                            <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Aucun</SelectItem>
                            {mathSkills.map(skill => (
                                <SelectItem key={skill.slug} value={skill.slug}>{skill.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAddHomework} disabled={!week || isSaving}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter
                </Button>
            </CardContent>
        </Card>
    );
}
