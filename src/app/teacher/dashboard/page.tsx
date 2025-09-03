
'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Home, LogOut, UserPlus, Users, Trash2, Pencil, SlidersHorizontal } from 'lucide-react';
import { Logo } from '@/components/logo';
import { createStudent, getStudents, type Student, updateStudent, deleteStudent } from '@/services/students';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { skills as availableSkills, type SkillLevel } from '@/lib/skills';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const skillLevels: { value: SkillLevel, label: string }[] = [
    { value: 'A', label: 'A - Maternelle' },
    { value: 'B', label: 'B - CP/CE1' },
    { value: 'C', label: 'C - CE2/CM1' },
    { value: 'D', label: 'D - CM2/6ème' },
];

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [students, setStudents] = useState<Student[]>([]);

  // Form states
  const [newStudentName, setNewStudentName] = useState('');
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  
  // Editing states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedCode, setEditedCode] = useState('');
  const [editedLevels, setEditedLevels] = useState<Record<string, SkillLevel>>({});
  const [isUpdating, setIsUpdating] = useState(false);


  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
      try {
        const studentListData = await getStudents();
        setStudents(studentListData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({
          variant: 'destructive',
          title: "Erreur de chargement",
          description: "Impossible de charger les données du tableau de bord.",
        });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('teacher_authenticated') === 'true';
    if (!isAuthenticated) {
      router.replace('/teacher/login');
      return;
    }
    loadDashboardData();
  }, [router, loadDashboardData]);
  
  const handleLogout = () => {
    sessionStorage.removeItem('teacher_authenticated');
    router.push('/');
  }

  const handleCreateStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    setIsCreatingStudent(true);
    try {
        const newStudent = await createStudent(newStudentName);
        setStudents(prev => [...prev, newStudent].sort((a,b) => a.name.localeCompare(b.name)));
        toast({
            title: "Élève créé !",
            description: `L'élève ${newStudent.name} a été ajouté avec le code ${newStudent.code}.`,
        });
        setNewStudentName('');
    } catch(error) {
         toast({
            variant: 'destructive',
            title: "Erreur",
            description: "Impossible de créer l'élève.",
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
        levels: editedLevels
    });
    setIsUpdating(false);

    if (result.success) {
        setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, name: editedName, code: editedCode, levels: editedLevels } : s));
        toast({ title: "Élève mis à jour", description: `Les informations de ${editedName} ont été modifiées.` });
        closeEditModal();
    } else {
        toast({ variant: 'destructive', title: "Erreur", description: result.error || "Impossible de mettre à jour les informations." });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const result = await deleteStudent(studentId);
    if (result.success) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      toast({ title: "Élève supprimé", description: "L'élève a bien été supprimé de la liste." });
    } else {
       toast({ variant: 'destructive', title: "Erreur", description: result.error || "Impossible de supprimer l'élève." });
    }
  }

  const handleLevelChange = (skillSlug: string, level: SkillLevel) => {
    setEditedLevels(prev => ({ ...prev, [skillSlug]: level }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background p-4 sm:p-8">
        <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
          <Logo />
          <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                  <Link href="/"><Home className="mr-2"/> Accueil Principal</Link>
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2"/> Déconnexion
              </Button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Créer un nouvel élève</CardTitle>
                        <CardDescription>Ajoutez un élève et un code secret lui sera automatiquement assigné.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateStudent} className="flex items-center gap-4">
                            <Input 
                                placeholder="Prénom de l'élève" 
                                value={newStudentName}
                                onChange={e => setNewStudentName(e.target.value)}
                                required
                            />
                            <Button type="submit" disabled={isCreatingStudent}>
                                {isCreatingStudent ? <Loader2 className="animate-spin" /> : <UserPlus />}
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
                                                        <TooltipTrigger>
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
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Dialog for editing student */}
        <Dialog open={!!editingStudent} onOpenChange={(isOpen) => !isOpen && closeEditModal()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Modifier les informations de {editingStudent?.name}</DialogTitle>
                    <DialogDescription>
                       Changez le nom, le code secret ou les niveaux de compétence de l'élève.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className='grid grid-cols-2 gap-4'>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Prénom</Label>
                            <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-code">Code Secret</Label>
                            <Input id="edit-code" value={editedCode} onChange={(e) => setEditedCode(e.target.value.replace(/[^0-9]/g, ''))} maxLength={4} />
                        </div>
                    </div>
                     <div>
                        <Label className="font-semibold">Niveaux de compétence</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                             {availableSkills.map(skill => (
                                <div key={skill.slug} className="grid grid-cols-3 items-center gap-2">
                                    <Label htmlFor={`level-${skill.slug}`} className="text-right text-xs sm:text-sm">
                                        {skill.name}
                                    </Label>
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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
      </main>
    </TooltipProvider>
  );
}
