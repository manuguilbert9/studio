
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEnabledSkills, setEnabledSkills } from '@/services/teacher';
import { skills as allSkills } from '@/lib/skills';

export function ExercisesManager() {
    const [enabledSkills, setEnabledSkills] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const fetchEnabledSkills = useCallback(async () => {
        setIsLoading(true);
        const savedSkills = await getEnabledSkills();
        if (savedSkills === null) {
            // If settings have never been saved, enable all skills by default
            const allEnabled: Record<string, boolean> = {};
            allSkills.forEach(skill => {
                allEnabled[skill.slug] = true;
            });
            setEnabledSkills(allEnabled);
        } else {
            setEnabledSkills(savedSkills);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchEnabledSkills();
    }, [fetchEnabledSkills]);

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
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des exercices "En classe"</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-8">
                     <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestion des exercices "En classe"</CardTitle>
                <CardDescription>
                    Activez ou désactivez les exercices disponibles pour les élèves dans le mode "En classe".
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 rounded-lg bg-secondary/50">
                    {allSkills.map(skill => (
                        <div key={skill.slug} className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm">
                            <Label htmlFor={`skill-${skill.slug}`} className="flex flex-col gap-1">
                                <span className="font-semibold text-base">{skill.name}</span>
                                <span className="text-xs text-muted-foreground">{skill.description}</span>
                            </Label>
                            <Switch
                                id={`skill-${skill.slug}`}
                                checked={enabledSkills[skill.slug] ?? false}
                                onCheckedChange={() => handleToggleSkill(skill.slug)}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
