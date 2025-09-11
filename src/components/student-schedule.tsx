
'use client';

import { useState, useEffect, useContext } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserContext } from '@/context/user-context';
import { type Student, type ScheduleStep, updateStudent } from '@/services/students';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { GripVertical, PlusCircle, Trash2, Pen } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as AllIcons from 'lucide-react';

type IconName = keyof typeof AllIcons;
const iconNames = Object.keys(AllIcons) as IconName[];

function SortableStep({ step, isCurrent, isCompleted, onToggle, onRemove, onUpdate }: { 
    step: ScheduleStep, 
    isCurrent: boolean, 
    isCompleted: boolean, 
    onToggle: (id: string, checked: boolean) => void,
    onRemove: (id: string) => void,
    onUpdate: (id: string, text: string, icon: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(step.text);
    const [editIcon, setEditIcon] = useState(step.icon);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const IconComponent = AllIcons[editIcon as IconName] || AllIcons.Pen;
    
    const handleSave = () => {
        onUpdate(step.id, editText, editIcon);
        setIsEditing(false);
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} className={cn(
            "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
            isCurrent && "border-primary ring-2 ring-primary/50 shadow-lg",
            isCompleted ? "bg-green-100 border-green-300" : "bg-card",
        )}>
            <div {...listeners} className="cursor-grab text-muted-foreground">
                <GripVertical />
            </div>
            <Checkbox 
                id={`step-${step.id}`} 
                checked={isCompleted} 
                onCheckedChange={(checked) => onToggle(step.id, !!checked)}
                className="h-6 w-6"
            />
            {isEditing ? (
                <>
                    <IconComponent className="h-8 w-8 text-primary" />
                    <Input value={editText} onChange={e => setEditText(e.target.value)} className="text-lg" />
                    <Input value={editIcon} onChange={e => setEditIcon(e.target.value)} className="text-sm w-32" placeholder="Icon name" />
                    <Button onClick={handleSave} size="sm">OK</Button>
                </>
            ) : (
                <>
                    <IconComponent className="h-8 w-8 text-primary" />
                    <label htmlFor={`step-${step.id}`} className={cn("text-xl font-medium flex-grow", isCompleted && "line-through text-muted-foreground")}>
                        {step.text}
                    </label>
                     <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <Pen className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onRemove(step.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    );
}


export function StudentSchedule() {
    const { student, setStudent } = useContext(UserContext);
    const { toast } = useToast();
    const [schedule, setSchedule] = useState<ScheduleStep[]>([]);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [newStepText, setNewStepText] = useState('');
    
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => {
        if (student) {
            setSchedule(student.schedule || []);
            const storedCompleted = localStorage.getItem(`schedule_completed_${student.id}`);
            if(storedCompleted) {
                setCompletedSteps(JSON.parse(storedCompleted));
            } else {
                setCompletedSteps([]);
            }
        }
    }, [student]);

    const handleUpdateAndSave = async (newSchedule: ScheduleStep[]) => {
        if (!student) return;
        setSchedule(newSchedule);
        const result = await updateStudent(student.id, { schedule: newSchedule });
        if (result.success) {
             setStudent({...student, schedule: newSchedule});
        } else {
             toast({ variant: 'destructive', title: "Erreur", description: "Impossible de sauvegarder le planning."})
        }
    }

    const handleAddStep = () => {
        if (!newStepText.trim()) return;
        const newStep: ScheduleStep = {
            id: Date.now().toString(),
            text: newStepText,
            icon: 'Pen' // Default icon
        };
        handleUpdateAndSave([...schedule, newStep]);
        setNewStepText('');
    };
    
    const handleRemoveStep = (idToRemove: string) => {
        handleUpdateAndSave(schedule.filter(step => step.id !== idToRemove));
    };

    const handleUpdateStep = (id: string, text: string, icon: string) => {
        const newSchedule = schedule.map(step => step.id === id ? { ...step, text, icon } : step);
        handleUpdateAndSave(newSchedule);
    };

    const handleToggleStep = (id: string, checked: boolean) => {
        const newCompleted = checked 
            ? [...completedSteps, id]
            : completedSteps.filter(stepId => stepId !== id);
        
        setCompletedSteps(newCompleted);
        if(student) {
            localStorage.setItem(`schedule_completed_${student.id}`, JSON.stringify(newCompleted));
        }
    };
    
    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        if (over && active.id !== over.id) {
          const oldIndex = schedule.findIndex(s => s.id === active.id);
          const newIndex = schedule.findIndex(s => s.id === over.id);
          const newOrderedSchedule = arrayMove(schedule, oldIndex, newIndex);
          handleUpdateAndSave(newOrderedSchedule);
        }
    }
    
    const currentStepIndex = schedule.findIndex(step => !completedSteps.includes(step.id));

    if (!student?.hasCustomSchedule) {
        return (
            <Card className="text-center p-8">
                <CardContent>
                    <p className="text-muted-foreground">L'enseignant n'a pas activé de planning personnalisé pour toi.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={schedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {schedule.map((step, index) => (
                             <SortableStep
                                key={step.id}
                                step={step}
                                isCurrent={index === currentStepIndex}
                                isCompleted={completedSteps.includes(step.id)}
                                onToggle={handleToggleStep}
                                onRemove={handleRemoveStep}
                                onUpdate={handleUpdateStep}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <div className="flex items-center gap-2 pt-4 border-t">
                    <Input 
                        placeholder="Ajouter une nouvelle étape..." 
                        value={newStepText} 
                        onChange={e => setNewStepText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddStep()}
                    />
                    <Button onClick={handleAddStep}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Ajouter
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
