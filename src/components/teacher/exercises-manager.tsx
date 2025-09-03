
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { getEnabledSkills, setEnabledSkills } from '@/services/teacher';
import { skills as availableSkills } from '@/lib/skills';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export function ExercisesManager() {
    const { toast } = useToast();
    const [enabledSkills, setEnabledSkills] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchSkills() {
            setIsLoading(true);
            const skillsState = await getEnabledSkills();
            setEnabledSkills(skillsState);
            setIsLoading(false);
        }
        fetchSkills();
    }, []);

    const handleToggleSkill = (slug: string) => {
        setEnabledSkills(prev => ({
            ...prev,
            [slug]: !prev[slug]
        }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const result = await setEnabledSkills(enabledSkills);
        if (result.success) {
            toast({
                title: "Modifications enregistrées",
                description: "La liste des exercices disponibles a été mise à jour."
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible d'enregistrer les modifications."
            });
        }
        setIsSaving(false);
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Exercices "En Classe"</CardTitle>
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
                <CardTitle>Gestion des Exercices "En Classe"</CardTitle>
                <CardDescription>
                    Cochez les exercices que vous souhaitez rendre disponibles pour les élèves en mode "En classe".
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {availableSkills.map(skill => (
                    <div key={skill.slug} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                        <div className='flex items-center gap-4'>
                            <div className="text-primary">{skill.icon}</div>
                            <div>
                                <h3 className="font-bold text-lg">{skill.name}</h3>
                                <p className="text-xs text-muted-foreground">{skill.description}</p>
                            </div>
                        </div>
                        <Switch
                            checked={enabledSkills[skill.slug] ?? false}
                            onCheckedChange={() => handleToggleSkill(skill.slug)}
                            aria-label={`Activer/Désactiver l'exercice ${skill.name}`}
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Enregistrer les modifications
                </Button>
            </CardFooter>
        </Card>
    );
}
