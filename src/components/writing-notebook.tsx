

'use client';

import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { UserContext } from '@/context/user-context';
import { getWritingEntriesForUser, saveWritingEntry, type WritingEntry } from '@/services/writing';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function WritingNotebook() {
    const { student } = useContext(UserContext);
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [entries, setEntries] = useState<WritingEntry[]>([]);
    const [currentText, setCurrentText] = useState('');
    
    // Find the latest entry made today
    const todaysLatestEntry = entries.find(entry => isToday(new Date(entry.createdAt)));

    useEffect(() => {
        if (student) {
            getWritingEntriesForUser(student.id).then(userEntries => {
                setEntries(userEntries);
                const latestEntry = userEntries[0]; // Entries are sorted by date descending
                if (latestEntry && isToday(new Date(latestEntry.createdAt))) {
                    setCurrentText(latestEntry.text);
                } else {
                    setCurrentText(''); // Start fresh if no entry today
                }
                setIsLoading(false);
            });
        } else {
             setIsLoading(false);
        }
    }, [student]);

    const handleSave = async () => {
        if (!student || !currentText.trim()) return;

        setIsSaving(true);
        const result = await saveWritingEntry(student.id, currentText);
        setIsSaving(false);

        if (result.success) {
            toast({
                title: "Texte enregistré !",
                description: "Ton cahier d'écriture est à jour.",
                className: "bg-green-100 border-green-500 text-green-800",
            });
            // Refresh entries to show the new/updated one
            const userEntries = await getWritingEntriesForUser(student.id);
            setEntries(userEntries);
        } else {
             toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Ton texte n'a pas pu être sauvegardé. Réessaye plus tard.",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!student) {
        return (
             <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-center">Connexion requise</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        Tu dois être connecté pour utiliser le cahier d'écriture.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <pre className="p-4 bg-muted text-xs rounded-lg overflow-auto">
                <code>{JSON.stringify(entries, null, 2)}</code>
            </pre>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Ton texte du jour</CardTitle>
                    <CardDescription>
                        {todaysLatestEntry ? "Continue d'écrire ou modifie ton texte." : "Écris ce que tu veux : une histoire, ce que tu as fait, une poésie..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Commence à écrire ici..."
                        rows={12}
                        className="text-lg leading-relaxed"
                    />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving || !currentText.trim()}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer le texte
                    </Button>
                </CardFooter>
            </Card>
            
            {entries.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Tes anciens textes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {entries.map(entry => (
                                <AccordionItem value={entry.id} key={entry.id}>
                                    <AccordionTrigger className="text-lg hover:no-underline">
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold">
                                                {format(new Date(entry.createdAt), "EEEE d MMMM yyyy", { locale: fr })}
                                            </span>
                                            {isToday(new Date(entry.createdAt)) && (
                                                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Enregistré aujourd'hui
                                                </span>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap font-body text-lg">
                                        {entry.text}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
