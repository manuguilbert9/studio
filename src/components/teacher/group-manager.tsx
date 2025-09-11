
'use client';

import { useState, FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import { createGroup, updateGroup, deleteGroup, type Group } from '@/services/groups';
import { updateStudent, type Student } from '@/services/students';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface GroupManagerProps {
    students: Student[];
    groups: Group[];
    onDataChange: () => void;
}

export function GroupManager({ students, groups, onDataChange }: GroupManagerProps) {
    const { toast } = useToast();
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupName, setEditingGroupName] = useState('');

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
            onDataChange();
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
            onDataChange();
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de renommer le groupe." });
        }
        setEditingGroupId(null);
        setEditingGroupName('');
    }
    
    const handleDeleteGroup = async (groupId: string) => {
        // Unassign students first
        const studentsInGroup = students.filter(s => s.groupId === groupId);
        for (const student of studentsInGroup) {
            await updateStudent(student.id, { groupId: '' });
        }
        
        const result = await deleteGroup(groupId);
        if(result.success) {
             toast({ title: "Groupe supprimé."});
             onDataChange();
        } else {
             toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer le groupe." });
        }
    }

    const handleAssignStudent = async (studentId: string, groupId: string) => {
        const result = await updateStudent(studentId, { groupId: groupId === 'none' ? '' : groupId });
        if(result.success) {
             toast({ title: "Élève assigné."});
             onDataChange();
        } else {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'assigner l'élève." });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
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
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Groupes</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {groups.length === 0 ? (
                           <p className="text-center text-muted-foreground py-4">Aucun groupe créé.</p>
                       ) : (
                           <Table>
                               <TableHeader>
                                   <TableRow>
                                       <TableHead>Nom du Groupe</TableHead>
                                       <TableHead>Membres</TableHead>
                                       <TableHead className="text-right">Actions</TableHead>
                                   </TableRow>
                               </TableHeader>
                               <TableBody>
                                   {groups.map(group => (
                                       <TableRow key={group.id}>
                                           <TableCell>
                                                {editingGroupId === group.id ? (
                                                    <Input value={editingGroupName} onChange={e => setEditingGroupName(e.target.value)} onBlur={() => handleUpdateGroup(group.id)} onKeyDown={e => e.key === 'Enter' && handleUpdateGroup(group.id)} autoFocus />
                                                ) : (
                                                    <span className="font-medium">{group.name}</span>
                                                )}
                                           </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {(studentsByGroup[group.id] || []).map(s => s.name).join(', ') || 'Aucun élève'}
                                                </span>
                                           </TableCell>
                                           <TableCell className="text-right">
                                               <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }}>
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
                                                        <AlertDialogTitle>Supprimer ce groupe ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Les élèves de ce groupe ne seront plus assignés à aucun groupe.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteGroup(group.id)}>Supprimer</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                           </TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                       )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Assignation des Élèves</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {students.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Aucun élève à assigner.</p>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {students.map(student => (
                                   <div key={student.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                                        <span className="font-medium flex-grow">{student.name}</span>
                                        <Select value={student.groupId || 'none'} onValueChange={(value) => handleAssignStudent(student.id, value)}>
                                            <SelectTrigger className="w-[150px] h-8">
                                                <SelectValue placeholder="Groupe..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Aucun groupe</SelectItem>
                                                {groups.map(g => (
                                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                   </div>
                               ))}
                           </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
