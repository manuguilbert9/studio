
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
import { type SpellingProgress } from '@/services/spelling';
import { getSkillBySlug, difficultyLevelToString, allSkillCategories } from '@/lib/skills';

interface ReportGeneratorProps {
    students: Student[];
    allScores: Score[];
    allSpellingProgress: SpellingProgress[];
}

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

        const scores = allScores.filter(s => 
            s.userId === selectedStudentId &&
            new Date(s.createdAt) >= dateRange.from! &&
            new Date(s.createdAt) <= dateRange.to!
        ).sort((a,b) => a.skill.localeCompare(b.skill));
        
        const spellingProgress = allSpellingProgress.find(p => p.userId === selectedStudentId)?.progress || {};

        const doc = new jsPDF();

        // --- HEADER ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(student.name, 105, 20, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const dateString = `Bilan du ${format(dateRange.from, 'd MMMM yyyy', { locale: fr })} au ${format(dateRange.to, 'd MMMM yyyy', { locale: fr })}`;
        doc.text(dateString, 105, 30, { align: 'center' });

        let yPos = 45;

        // --- Group scores by category ---
        const scoresByCategory: Record<string, Score[]> = {};
        allSkillCategories.forEach(cat => scoresByCategory[cat] = []);
        scores.forEach(score => {
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
                head: [[{ content: category, styles: { fillColor: [234, 88, 12], fontStyle: 'bold' } }]],
                theme: 'plain',
            });
            yPos = (doc as any).lastAutoTable.finalY;

            const body = categoryScores.map(score => {
                const skill = getSkillBySlug(score.skill);
                const scoreText = score.skill === 'reading-race' ? `${score.score} MCLM` : `${Math.round(score.score)} %`;
                const level = difficultyLevelToString(score.skill, score.score, score.calculationSettings, score.currencySettings, score.timeSettings, score.calendarSettings, score.numberLevelSettings, score.countSettings);
                const date = format(new Date(score.createdAt), 'dd/MM/yy');

                let errorsText = '';
                if(score.homeworkSession && skill?.slug === 'spelling'){
                    // This logic is incomplete as we don't have spelling list ID in scores
                    // A proper implementation would require restructuring how spelling results are saved.
                }

                return [skill?.name || score.skill, scoreText, level || 'N/A', date, errorsText];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Exercice', 'Score', 'Niveau', 'Date', 'Erreurs']],
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] },
                didDrawPage: (data) => {
                    yPos = data.cursor?.y || 20;
                }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
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

