

'use client';

import { useState, FormEvent, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { createStudent, type Student, updateStudent, deleteStudent } from '@/services/students';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { skills as availableSkills, type SkillLevel, allSkillCategories } from '@/lib/skills';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const skillLevels: { value: SkillLevel, label: string }[] = [
    { value: 'A', label: 'A - Maternelle' },
    { value: 'B', label: 'B - CP/CE1' },
    { value: 'C', label: 'C - CE2/CM1' },
    { value: 'D', label: 'D - CM2/6ème' },
];

interface StudentManagerProps {
    students: Student[];
    onStudentsChange: () => void;
}

export function StudentManager({ students, onStudentsChange }: StudentManagerProps) {
    const { toast } = useToast();
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentCode, setNewStudentCode] = useState('');
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);
    
    // Editing states
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedCode, setEditedCode] = useState('');
    const [editedLevels, setEditedLevels] = useState<Record<string, SkillLevel>>({});
    const [editedEnabledSkills, setEditedEnabledSkills] = useState<Record<string, boolean>>({});
    const [isUpdating, setIsUpdating] = useState(false);


     const handleCreateStudent = async (e: FormEvent) => {
        e.preventDefault();
        if (!newStudentName.trim() || !newStudentCode.trim()) {
            toast({ variant: 'destructive', title: "Champs requis", description: "Le prénom et le code sont obligatoires." });
            return;
        };

        if (newStudentCode.length !== 4 || !/^\d{4}$/.test(newStudentCode)) {
            toast({ variant: 'destructive', title: "Code invalide", description: "Le code secret doit être composé de 4 chiffres." });
            return;
        }

        setIsCreatingStudent(true);
        try {
            await createStudent(newStudentName, newStudentCode);
            toast({
                title: "Élève créé !",
                description: `L'élève ${newStudentName} a été ajouté.`,
            });
            setNewStudentName('');
            setNewStudentCode('');
            onStudentsChange(); // Refresh the list
        } catch(error) {
            toast({
                variant: 'destructive',
                title: "Erreur",
                description: "Impossible de créer l'élève. Ce prénom est peut-être déjà utilisé.",
            });
        } finally {
            setIsCreatingStudent(false);
        }
    }
    
    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setEditedName(student.name);
        setEditedCode(student.code);
        setEditedLevels(student.levels || {});

        if (student.enabledSkills) {
             setEditedEnabledSkills(student.enabledSkills);
        } else {
            const allEnabled: Record<string, boolean> = {};
            availableSkills.forEach(skill => allEnabled[skill.slug] = true);
            setEditedEnabledSkills(allEnabled);
        }
    };

    const closeEditModal = () => {
        setEditingStudent(null);
    };
    
      const handleUpdateStudent = async () => {
        if (!editingStudent) return;
        
        if (editedCode.length !== 4 || !/^\d{4}$/.test(editedCode)) {
        toast({ variant: 'destructive', title: "Code invalide", description: "Le code secret doit être composé de 4 chiffres." });
        return;
        }

        setIsUpdating(true);
        const result = await updateStudent(editingStudent.id, {
            name: editedName,
            code: editedCode,
            levels: editedLevels,
            enabledSkills: editedEnabledSkills,
        });
        
        if (result.success) {
            onStudentsChange();
            toast({ title: "Élève mis à jour", description: `Les informations de ${editedName} ont été modifiées.` });
            closeEditModal();
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: result.error || "Impossible de mettre à jour les informations." });
        }
         setIsUpdating(false);
    };

    const handleDeleteStudent = async (studentId: string) => {
        const result = await deleteStudent(studentId);
        if (result.success) {
            onStudentsChange();
            toast({ title: "Élève supprimé", description: "L'élève a bien été supprimé de la liste." });
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: result.error || "Impossible de supprimer l'élève." });
        }
    }

    const handleLevelChange = (skillSlug: string, level: SkillLevel) => {
        setEditedLevels(prev => ({ ...prev, [skillSlug]: level }));
    };

    const handleEnabledSkillChange = (skillSlug: string, isEnabled: boolean) => {
        setEditedEnabledSkills(prev => ({...prev, [skillSlug]: isEnabled}));
    };
    
    const skillsByCategory = useMemo(() => {
        const grouped: Record<string, typeof availableSkills> = {};
        allSkillCategories.forEach(cat => grouped[cat] = []);
        availableSkills.forEach(skill => {
            if (grouped[skill.category]) {
                grouped[skill.category].push(skill);
            }
        });
        return grouped;
    }, []);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Créer un nouvel élève</CardTitle>
                            <CardDescription>Ajoutez un élève avec son prénom et un code secret à 4 chiffres.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateStudent} className="space-y-4">
                                <Input 
                                    placeholder="Prénom de l'élève" 
                                    value={newStudentName}
                                    onChange={e => setNewStudentName(e.target.value)}
                                    required
                                />
                                 <Input 
                                    placeholder="Code à 4 chiffres" 
                                    value={newStudentCode}
                                    onChange={e => setNewStudentCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    maxLength={4}
                                    required
                                />
                                <Button type="submit" disabled={isCreatingStudent} className="w-full">
                                    {isCreatingStudent ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2" />}
                                    Ajouter l'élève
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des élèves</CardTitle>
                            <CardDescription>Consultez la liste des élèves, leurs codes et leurs niveaux.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {students.length === 0 ? (
                               <p className="text-center text-muted-foreground py-8">Aucun élève n'a encore été créé.</p>
                           ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Prénom</TableHead>
                                            <TableHead>Code Secret</TableHead>
                                            <TableHead>Niveaux</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell className="font-mono font-bold">{student.code}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                    {student.levels && Object.entries(student.levels).length > 0 ? (
                                                        Object.entries(student.levels).map(([skill, level]) => (
                                                            <Tooltip key={skill}>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="secondary">{level}</Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{availableSkills.find(s => s.slug === skill)?.name || skill}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">Aucun</span>
                                                    )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditModal(student)}>
                                                            <Pencil />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                                    <Trash2 />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action est irréversible. Toutes les données de l'élève {student.name}, y compris ses scores, seront définitivement supprimées.
                                                                </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>
                                                                        Supprimer
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={!!editingStudent} onOpenChange={(isOpen) => !isOpen && closeEditModal()}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Modifier les informations de {editingStudent?.name}</DialogTitle>
                    </DialogHeader>
                     <Tabs defaultValue="levels" className="pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general">Général</TabsTrigger>
                            <TabsTrigger value="levels">Niveaux</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="general" className="h-full">
                           <ScrollArea className="h-[calc(80vh-150px)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4 pr-6">
                                     <div className='space-y-4 md:col-span-2 grid grid-cols-2 gap-4'>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name">Prénom</Label>
                                            <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-code">Code Secret</Label>
                                            <Input id="edit-code" value={editedCode} onChange={(e) => setEditedCode(e.target.value.replace(/[^0-9]/g, ''))} maxLength={4} />
                                        </div>
                                    </div>
                                    <div className="space-y-4 md:col-span-2">
                                        <h3 className="font-semibold border-b pb-2">Exercices activés</h3>
                                        <div className="space-y-4">
                                            {allSkillCategories.map(category => {
                                                const skillsInCategory = skillsByCategory[category];
                                                if (!skillsInCategory || skillsInCategory.length === 0) return null;
                                                return (
                                                    <div key={category}>
                                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                                                        <div className="space-y-2 p-3 rounded-lg bg-secondary/30">
                                                            {skillsInCategory.map(skill => (
                                                                <div key={skill.slug} className="flex items-center justify-between p-2 bg-card rounded-lg shadow-sm">
                                                                    <Label htmlFor={`skill-switch-${skill.slug}`} className="text-sm font-medium">
                                                                        {skill.name}
                                                                    </Label>
                                                                    <Switch
                                                                        id={`skill-switch-${skill.slug}`}
                                                                        checked={editedEnabledSkills[skill.slug] ?? false}
                                                                        onCheckedChange={(checked) => handleEnabledSkillChange(skill.slug, checked)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="levels" className="h-full">
                             <ScrollArea className="h-[calc(80vh-150px)]">
                                <div className="space-y-4 py-4 pr-6">
                                    <h3 className="font-semibold border-b pb-2">Niveaux de compétence</h3>
                                    {allSkillCategories.map(category => {
                                        const skillsInCategory = skillsByCategory[category];
                                        if (!skillsInCategory || skillsInCategory.length === 0) return null;
                                        return (
                                            <div key={category}>
                                                <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                                                <div className="space-y-2">
                                                    {skillsInCategory.map(skill => (
                                                        <div key={skill.slug} className="grid grid-cols-3 items-center gap-2">
                                                            <Label htmlFor={`level-${skill.slug}`} className="text-right text-xs sm:text-sm">
                                                                {skill.name}
                                                            </Label>
                                                            {skill.isFixedLevel ? (
                                                                <div className="col-span-2">
                                                                    <Badge variant="secondary">Niveau {skill.isFixedLevel}</Badge>
                                                                </div>
                                                            ) : (
                                                                <Select 
                                                                    value={editedLevels[skill.slug]} 
                                                                    onValueChange={(value) => handleLevelChange(skill.slug, value as SkillLevel)}
                                                                >
                                                                    <SelectTrigger className="col-span-2 h-9">
                                                                        <SelectValue placeholder="Choisir..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {skillLevels.map(level => (
                                                                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateStudent} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="animate-spin mr-2" />}
                            Enregistrer les modifications
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
