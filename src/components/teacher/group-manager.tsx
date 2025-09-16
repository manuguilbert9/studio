

'use client';

import { useState, FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus, Pencil, Trash2, Users, X } from 'lucide-react';
import { createGroup, updateGroup, deleteGroup, type Group } from '@/services/groups';
import { updateStudent, type Student } from '@/services/students';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';

interface GroupManagerProps {
    initialStudents: Student[];
    initialGroups: Group[];
}

export function GroupManager({ initialStudents, initialGroups }: GroupManagerProps) {
    const { toast } = useToast();
    const [students, setStudents] = useState(initialStudents);
    const [groups, setGroups] = useState(initialGroups);

    const [newGroupName, setNewGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState('');
    
    // Update local state when initial props change from real-time listener
    useState(() => {
        setStudents(initialStudents);
        setGroups(initialGroups);
    });

    const studentsByGroup = useMemo(() => {
        const map: Record<string, Student[]> = {};
        groups.forEach(g => map[g.id] = []);
        students.forEach(s => {
            if (s.groupId && map[s.groupId]) {
                map[s.groupId].push(s);
            }
        });
        return map;
    }, [students, groups]);

    const unassignedStudents = useMemo(() => students.filter(s => !s.groupId), [students]);

    const handleCreateGroup = async (e: FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setIsCreating(true);
        const result = await createGroup(newGroupName);
        if (result.id) {
            toast({ title: "Groupe créé !", description: `Le groupe "${newGroupName}" a été ajouté.` });
            setNewGroupName('');
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de créer le groupe." });
        }
        setIsCreating(false);
    };
    
    const handleUpdateGroup = async (groupId: string) => {
        if (!editingGroupName.trim()) return;
        const result = await updateGroup(groupId, { name: editingGroupName });
         if (result.success) {
            toast({ title: "Groupe mis à jour."});
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de renommer le groupe." });
        }
        setEditingGroupId(null);
        setEditingGroupName('');
    }
    
    const handleDeleteGroup = async (groupId: string) => {
        const studentsInGroup = students.filter(s => s.groupId === groupId);
        for (const student of studentsInGroup) {
            await updateStudent(student.id, { groupId: '' });
        }
        
        const result = await deleteGroup(groupId);
        if(result.success) {
             toast({ title: "Groupe supprimé."});
        } else {
             toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer le groupe." });
        }
    }

     const handleToggleStudentInGroup = async (studentId: string, groupId: string, isChecked: boolean) => {
        const newGroupId = isChecked ? groupId : '';
        const result = await updateStudent(studentId, { groupId: newGroupId });
        
        if(!result.success) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'assigner l'élève." });
        }
        // No manual refresh needed, onSnapshot will handle it.
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Créer un nouveau groupe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <Input 
                                placeholder="Nom du groupe (ex: Abeilles)" 
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                required
                            />
                            <Button type="submit" disabled={isCreating} className="w-full">
                                {isCreating ? <Loader2 className="animate-spin mr-2" /> : <Users className="mr-2" />}
                                Créer le groupe
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Élèves sans groupe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {unassignedStudents.length > 0 ? (
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {unassignedStudents.map(student => <li key={student.id}>{student.name}</li>)}
                            </ul>
                        ) : (
                            <p className="text-sm text-center text-muted-foreground">Tous les élèves sont dans un groupe.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Groupes</CardTitle>
                        <CardDescription>Gérez les noms de groupes et leur composition.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {groups.length === 0 ? (
                           <p className="text-center text-muted-foreground py-4">Aucun groupe créé.</p>
                       ) : (
                           groups.map(group => (
                               <Card key={group.id} className="p-4">
                                   <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {editingGroupId === group.id ? (
                                                <Input value={editingGroupName} onChange={e => setEditingGroupName(e.target.value)} onBlur={() => handleUpdateGroup(group.id)} onKeyDown={e => e.key === 'Enter' && handleUpdateGroup(group.id)} autoFocus className="h-9"/>
                                            ) : (
                                                <h3 className="font-semibold text-lg">{group.name}</h3>
                                            )}
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }}>
                                                <Pencil className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline">Gérer les membres</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Membres du groupe "{group.name}"</DialogTitle>
                                                    </DialogHeader>
                                                    <ScrollArea className="h-80 pr-4">
                                                    <div className="space-y-3 py-2">
                                                        {students.map(student => (
                                                            <div key={student.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary">
                                                                <Checkbox 
                                                                    id={`student-${group.id}-${student.id}`}
                                                                    checked={student.groupId === group.id}
                                                                    onCheckedChange={(checked) => handleToggleStudentInGroup(student.id, group.id, !!checked)}
                                                                />
                                                                <Label htmlFor={`student-${group.id}-${student.id}`} className="font-medium text-base cursor-pointer">
                                                                    {student.name}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                        <Trash2 />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer "{group.name}" ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Les élèves de ce groupe ne seront plus assignés. Cette action ne supprime pas les élèves.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteGroup(group.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                         </div>
                                   </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        <p><span className="font-medium">Membres :</span> {(studentsByGroup[group.id] || []).map(s => s.name).join(', ') || 'Aucun élève'}</p>
                                    </div>
                               </Card>
                           ))
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
