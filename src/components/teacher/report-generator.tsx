
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

// Simple SVG logo as a base64 data URI
const logoSvgDataUri = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNwYXJrbGVzIj48cGF0aCBkPSJtMTIgMyA0IDEuMDM1VjggbC00IDEuMDM1VjN6TTUgMTQgNCAxNXY0LjAzNUw1IDE4di00ek0xOSAxNCAyMCAxNXY0LjAzNUwxOSAxOHYtNHpNNCA5IDUgN2gyTTIgMTJsMy0xdi0yTTIwIDdsMiAyLTItM3YtMk0xMiA5djNNNiAxNWwyLTJNNTIgNWwtMS0xTTggM2wtMS0xIi8+PHBhdGggZD0iTTcgOGgxbDIgNWgxTDEyIDEzbC0yLTUiLz48L3N2Zz4=";


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
        doc.addImage(logoSvgDataUri, 'SVG', 15, 15, 10, 10);
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
                const homeworkId = score.homeworkSession ? `liste-${score.homeworkSession}` : ''; // This needs to be improved if lists change
                 if (score.skill === 'spelling' && homeworkId) {
                     const spellingResult = Object.entries(studentSpellingProgress).find(([key, _]) => key.includes(homeworkId));
                     if(spellingResult && spellingResult[1].errors.length > 0) {
                        errorsText = spellingResult[1].errors.join(', ');
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
