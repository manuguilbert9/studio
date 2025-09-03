
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { getEnabledSkills, setEnabledSkills } from '@/services/teacher';
import { skills as availableSkills } from '@/lib/skills';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export function ExercisesManager() {
    const { toast } = useToast();
    const [enabledSkills, setEnabledSkills] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchSkills() {
            setIsLoading(true);
            const enabledSlugs = await getEnabledSkills();
            
            const skillsState: Record<string, boolean> = {};
            if (enabledSlugs === null) {
                availableSkills.forEach(skill => skillsState[skill.slug] = true);
            } else {
                availableSkills.forEach(skill => {
                    skillsState[skill.slug] = enabledSlugs.includes(skill.slug);
                });
            }
            setEnabledSkills(skillsState);
            setIsLoading(false);
        }
        fetchSkills();
    }, []);

    const handleSkillToggle = useCallback((slug: string, checked: boolean) => {
        setEnabledSkills(prev => ({ ...prev, [slug]: checked }));
    }, []);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const skillsToSave = Object.keys(enabledSkills).filter(slug => enabledSkills[slug]);
        const result = await setEnabledSkills(skillsToSave);
        
        if (result.success) {
            toast({ title: "Paramètres enregistrés", description: "La liste des exercices disponibles a été mise à jour." });
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: result.error || "Impossible d'enregistrer les paramètres." });
        }
        setIsSaving(false);
    };

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
                    Sélectionnez les exercices que les élèves peuvent utiliser en mode "En classe". 
                    Les changements seront visibles immédiatement pour les élèves.
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
                            onCheckedChange={(checked) => handleSkillToggle(skill.slug, checked)}
                            aria-label={`Activer/Désactiver l'exercice ${skill.name}`}
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                    Enregistrer les modifications
                </Button>
            </CardFooter>
        </Card>
    );
}

