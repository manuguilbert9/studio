
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getEnabledSkills } from '@/services/teacher';
import { skills as availableSkills } from '@/lib/skills';
import { Switch } from '@/components/ui/switch';

export function ExercisesManager() {
    const [enabledSkills, setEnabledSkills] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSkills() {
            setIsLoading(true);
            const skillsState = await getEnabledSkills();
            setEnabledSkills(skillsState);
            setIsLoading(false);
        }
        fetchSkills();
    }, []);


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
                    Voici la liste des exercices que les élèves peuvent utiliser en mode "En classe". 
                    Pour modifier cette liste, vous devez éditer le fichier `src/data/teacher-settings.json` et redéployer l'application.
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
                            disabled={true}
                            aria-label={`Statut de l'exercice ${skill.name}`}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
