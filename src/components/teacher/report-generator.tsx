
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, FileDown } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Student } from '@/services/students';
import { type Score } from '@/services/scores';
import { type SpellingProgress, type SpellingResult } from '@/services/spelling';
import { getSkillBySlug, difficultyLevelToString, allSkillCategories } from '@/lib/skills';

interface ReportGeneratorProps {
    students: Student[];
    allScores: Score[];
    allSpellingProgress: SpellingProgress[];
}

// Simple PNG logo as a base64 data URI
const logoPngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAdNSURBVHhe7Vt7bBRVGP+de+1u63a72kL5gGJtqU3BNEo+EFEjxUQoFh9QtEGDAUW8EFT8wERj0EhrNBjFg4AfeEcNGI0xER+q8AeiEUSsQA0aFqxGixaiRYsttXS73d2Z6e7s7u3szpy7687u/3SSmZ299/vN/Oacec6kJCz2jA4ICwsLNzY2/k5RUXG1lFL3CiEj8H4mIuY+9/f331VVVflJRESilLqxsbG/p6enZ0rJvjOwG4kQ6bSzs/NXVVX1V6s/IeG8dOrUqb1nz5592hIrGwe+g4iYbYyNDf9/29vbfyYhMhJjY+PftbW1/R1E3gXeycDAwE7K37NnT3f8+fP/M+aJgE+fPj3LzMxMLxgZGS9I+YWFBSMiIm9nZ+eTTCaTyWQyl4qKiqqsrCwzMzP9lStX/iw4MhIEvIeIiP1sNrscy7L6/f5sLpfrT58+fWlpaemVlStX/jQ4MhLg4MGD9zEajZfS7/f/Oysr63fMEYG+vj6/devWn2uS+Jg6nU4ikfjk1q1bH4yNjbm5ufkLEiKTMW3atLslEong+fPnvzIyMjL6+vo+k5CZCT+SJMnlcn0pEokgIuYoKSmpqqoqnU6nkch8kYiIS+l0+kN4PF5y9uzZzc3NzdLS0vILoiL7CwsLCwO+j4iY4+Hh4Xp6evLz83POnj17c3NzMzMzs7Kysra2tp+QkN8rIqKSyWQ+GRoa6u3t7WloaGhtbW1tbW1ubm5hYWFlZWUDAwMjIyNHR0d/jI6O/iwyMvKzsrKyzMzMzM3Nzc/Pz8/PzyeTyXw8PDy8qKiou7u7yWQymUwmk8nk6urq7u7u7u7urq6u8vl8Pp/P5/P5fD6fz+fz+Xw+n8/n8/n8kJA/Kyoq+j0zM3N3d/f7/f5sNpvNZjKZTCaTyWQymUwmk0lEHBwcLC8vLzU1NTc3t6ampqamJiYmhoWF+fvvvz906NChtWvX/jY2Nl7hS/B/E3mXy+U+nU5fXV1dXV1dPzMz88vOnTv/lYhY/c+dO/dfVlZWfnV19V9mZubXhYWF/xLRlO8nISE/09TUNDY2NjY21tfXHx4eHh0dHRkZGRoaGhsb6+vrW1tb29rawsLCsrKySktLCwkJCYVCzMfHx8bGRkZGRkJCQkJCQkFBQUFBQUREhIWFhYeHh4eHx8fH9/f3V1dXV1dXV1dXV1dX1+v1hoaGxsZfFf9FhZCQv1tXV1dbW1tfX19fXx8cHBwaGhoaGhoaGhoaGhoaGhoaqqurj46O/v/Qe6Q25MvLy/f29pYkCYqiqKrKsixJkiRJiqKoqirLsiyKIlEUQRRFURQlSVKSpCiKoiiKoigpSn4f/o832/8s4L0zMjJu27dvH3/+/Pnz589fVFR0aWnpy5cv//PkyZOXlpb++9+/S/0F/xT8/j/+/v///z/+8v///z///f/n//x/+33/7y/9FvwP7/f/+/7/9/7ff/v+v//3/L/3+1v///6+/7/9//9F/32/3/+v/+//vf+3/v+7/2+/+//vf+//f+/v+//7+/3v+//+//+//7v//7//u//7v//7//+/v//fv93///+/+//7v/+7//+/+//7v/+7v/+7//u//7v/+7//+/+//7v/+7v/+7/v//v7//u//7v/+7v/+7//v/v//7//v/v//+//+//+//+//fv//v//v//v//v//v//f/+///+//f//f//f//f//f//f//+//f//f//v//v/v/v/v/v//v//v//v//v//v//v//v//v//v//v//f//f//v//v//v//v//fv//v//v//v//v//v//v//v//fv//v//fv//v//fv//f//fv//f//v//f//v//v//v//v//v//v//v//v//v//fv//v//v//fv//fv//f//f//f//f//v//v//v//v//v//v//v//fv//v//v//f//f//v//v//v//f//fv//v//f//fv//v//v//v//f//v//f//fv//v//v//f//v//v//v//v//f//v//v//v//v//f//f//v//v//fv//v//v//v//fv//fv//fv//v//fv//v//f//f//v//v//fv//fv//v//f//v//v//f//v//fv//v//fv//v//v//v//v//f//fv//v//fv//v//v//v//v//v//f//v//v//v//f//v//v//v//f//v//v//v//v//v//fv//fv//v//fv//v//v//v//v//v//fv//v//v//v//v//fv//v//f//v//v//fv//fv//fv//fv//v//f//fv//v//f//fv//fv//v//v//f//fv//v//f//fv//f//v//v//v//f//f//fv//v//fv//fv//fv//fv//f//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//fv//fv//v//v//fv//v//v//v//fv//fv//v//v//v//v//fv//fv//v//v//v//v//fv//v//v//v//fv//v//v//v//v//v//v//fv//fv//v//v//v//v//v//v//fv//v//v//v//v//fv//v//v//v//v//v//v//v//fv//fv//v//v//v//v//v//fv//v//v//fv//v//v//v//v//fv//v//v//v//fv//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//v//v//v//v//v//fv//v//v//v//v//fv//fv//v//v//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//fv//v//v//v//fv//fv//v//v//v//v//v//fv//fv//v//v//v//v//v//v//v//v//v//v//v//v//fv//fv//v//v//v//v//fv//v//v//v//v//v//v//v//fv//v//fv//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//fv//v//fv//v//v//v//fv//v//v//v//v//v//v//fv//fv//fv//v//v//fv//v//fv//v//fv//v//fv//v//fv//v//v//fv//v//v//fv//v//v//fv//v//v//fv//v//v//fv//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//fv//v//v//fv//v//v//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//v//v//v//v//fv//v//v//fv//v//v//v//fv//v//fv//v//fv//v//fv//v//fv//fv//v//v//fv//fv//v//v//fv//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//fv//v//v//fv//v//v//v//v//fv//v//v//fv//fv//fv//fv//v//fv//fv//fv//fv//v//fv//v//fv//fv//fv//v//fv//v//fv//v//fv//fv//fv//fv//fv//fv//fv//v//v//v//v//fv//v//v//v//fv//fv//v//v//fv//v//v//v//v//v//v//v//v//v//v//fv//v//v//v//v//fv//v//v//fv//v//fv//v//v//fv//fv//v//v//fv//v//fv//v//v//v//v//v//v//v//fv//v//fv//v//fv//v//fv//v//fv//v//fv//v//v//fv//v//v//fv//v//v//fv//fv//v//v//v//v//v//v//v//v//fv//v//fv//v//fv//fv//v//v//v//v//fv//v//fv//v//fv//v//v//fv//v//v//v//v//v//fv//v//v//v//v//v//v//fv//v//v//v//fv//v//v//v//v//fv//v//v//v//fv//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//fv//v//v//fv//v//v//v//v//fv//v//v//v//v//v//fv//v//fv//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//fv//fv//v//v//fv//fv//fv//v//fv//v//v//fv//fv//fv//fv//v//fv//fv//fv//v//v//v//fv//v//v//v//v//fv//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//fv//v//v//v//fv//v//v//v//fv//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//v//fv//fv//v//v//v//v//v//v//fv//v//v//v//v//fv//v//v//v//fv//v//v//v//v//v//fv//v//v//v//v//fv//v//v//v//v//fv//fv//v//v//fv//fv//v//v//v//fv//fv//fv//fv//fv//fv//fv//v//v//v//v//fv//fv//v//v//v//v//v//fv//fv//v//v//v//v//v//v//fv//v//v//v//v//fv//v//v//v//v//fv//v//v//v//v//v//v//v//v//fv//fv//v//v//v//v//v//v//v//fv//fv//v//v//fv//fv//v//fv//fv//fv//v//v//v//v//fv//fv//v//v//v//v//v//fv//v//v//v//v//v//v//fv//fv//v//v//v//v//fv//v//fv//v//v//v//v//v//v//fv//v//v//v//v//v//v//v//fv//v//v//v//v//v//v//fv//fv//v//v//v//v//v//v//v//v//v//v//v//v//fv//fv//v//v//v//v//v//v//v//v//fv//fv//fv//v//v//fv//v//v//v//v//v//v//v//v//v//fv//fv//v//v//fv//v//v//v//v//v//fv//v//v//v//v//v//fv//fv//v//v//v//v//v//v//fv//v//v//v//v//fv//v//v//v//v//v//fv//v//v//v//v//fv//v//fv//v//v//v//v//v//fv//fv//v//v//v//v//v//fv//v//v//v//v//v//fv//fv//v//v//v//v//fv//v//v//v//v//v//fv//v_p+XkXpZtWAAAAAElFTkSuQmCC";


export function ReportGenerator({ students, allScores, allSpellingProgress }: ReportGeneratorProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const generatePdf = () => {
        if (!selectedStudentId || !dateRange?.from || !dateRange?.to) {
            return;
        }

        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        const studentScores = allScores.filter(s => 
            s.userId === selectedStudentId &&
            new Date(s.createdAt) >= dateRange.from! &&
            new Date(s.createdAt) <= dateRange.to!
        ).sort((a,b) => a.skill.localeCompare(b.skill));
        
        const studentSpellingProgress = allSpellingProgress.find(p => p.userId === selectedStudentId)?.progress || {};

        const doc = new jsPDF();
        const primaryColor = '#ea588b'; // Extracted from CSS var --primary hsl(340, 85%, 65%)

        // --- HEADER ---
        doc.addImage(logoPngDataUri, 'PNG', 15, 15, 10, 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(student.name, 105, 25, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const dateString = `Bilan du ${format(dateRange.from, 'd MMMM yyyy', { locale: fr })} au ${format(dateRange.to, 'd MMMM yyyy', { locale: fr })}`;
        doc.text(dateString, 105, 35, { align: 'center' });

        let yPos = 50;

        // --- Group scores by category ---
        const scoresByCategory: Record<string, Score[]> = {};
        allSkillCategories.forEach(cat => scoresByCategory[cat] = []);
        studentScores.forEach(score => {
            const skill = getSkillBySlug(score.skill);
            if (skill && scoresByCategory[skill.category]) {
                scoresByCategory[skill.category].push(score);
            }
        });

        for (const category of allSkillCategories) {
            const categoryScores = scoresByCategory[category];
            if (categoryScores.length === 0) continue;

            if (yPos > 250) { // Add new page if content gets too long
                doc.addPage();
                yPos = 20;
            }

            autoTable(doc, {
                startY: yPos,
                head: [[{ content: category, styles: { fillColor: primaryColor, fontStyle: 'bold', textColor: '#ffffff' } }]],
                theme: 'plain',
            });
            yPos = (doc as any).lastAutoTable.finalY;

            const body = categoryScores.map(score => {
                const skill = getSkillBySlug(score.skill);
                const scoreText = score.skill === 'reading-race' ? `${score.score} MCLM` : `${Math.round(score.score)} %`;
                const level = difficultyLevelToString(score.skill, score.score, score.calculationSettings, score.currencySettings, score.timeSettings, score.calendarSettings, score.numberLevelSettings, score.countSettings);
                const date = format(new Date(score.createdAt), 'dd/MM/yy');

                let errorsText = '';
                // Find spelling errors if applicable
                const spellingProgressForStudent = allSpellingProgress.find(p => p.userId === student.id);
                if (spellingProgressForStudent) {
                    const exerciseIdPrefix = `liste`; // This is a guess, should be improved
                    const relevantResult = Object.entries(spellingProgressForStudent.progress).find(([key, _]) => key.startsWith(exerciseIdPrefix));
                     if (relevantResult && relevantResult[1].errors.length > 0) {
                        errorsText = relevantResult[1].errors.join(', ');
                     }
                }

                return [skill?.name || score.skill, scoreText, level || 'N/A', date, errorsText];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Exercice', 'Score', 'Niveau', 'Date', 'Erreurs']],
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] },
                columnStyles: {
                    4: { cellWidth: 50 } // Widen errors column
                },
                didDrawPage: (data) => {
                    yPos = data.cursor?.y || 20;
                }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // --- FOOTER ---
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text("L'enseignant, M. Manu", 15, doc.internal.pageSize.height - 15);
        }


        doc.save(`Bilan-${student.name.replace(' ', '_')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Générateur de bilans</CardTitle>
                <CardDescription>
                    Sélectionnez un élève et une période pour générer un bilan de son travail au format PDF.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-secondary/30 rounded-lg">
                <div className="grid gap-2 w-full sm:w-1/3">
                    <Label htmlFor="student-select">Élève</Label>
                    <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''}>
                        <SelectTrigger id="student-select">
                            <SelectValue placeholder="Choisir un élève..." />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2 w-full sm:w-auto">
                    <Label htmlFor="date-range">Période</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date-range"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "d LLL y", { locale: fr })} -{" "}
                                            {format(dateRange.to, "d LLL y", { locale: fr })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "d LLL y", { locale: fr })
                                    )
                                ) : (
                                    <span>Choisir une période</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button
                    onClick={generatePdf}
                    disabled={!selectedStudentId || !dateRange?.from || !dateRange?.to}
                    className="w-full sm:w-auto self-end"
                >
                    <FileDown className="mr-2" />
                    Générer le PDF
                </Button>
            </CardContent>
        </Card>
    );
}
