
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, FileDown } from 'lucide-react';
import { format, startOfMonth, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Student } from '@/services/students';
import { type Score, CalculationState, ScoreDetail } from '@/services/scores';
import { getSkillBySlug, difficultyLevelToString, allSkillCategories } from '@/lib/skills';

const PRIMARY_COLOR = '#ea588b';
const LIGHT_RED_FILL = '#fee2e2';

interface ReportGeneratorProps {
    students: Student[];
    allScores: Score[];
}

export function ReportGenerator({ students, allScores }: ReportGeneratorProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [filterBySchoolTime, setFilterBySchoolTime] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });
    
    const generatePdfForStudent = (doc: jsPDF, student: Student, dateRange: DateRange) => {
        const studentScores = allScores.filter(s => {
            if (s.userId !== student.id || !dateRange.from || !dateRange.to) return false;
            
            const scoreDate = new Date(s.createdAt);
            const scoreHour = scoreDate.getHours();
            const scoreMinutes = scoreDate.getMinutes();

            const isInDateRange = scoreDate >= startOfDay(dateRange.from) && scoreDate <= endOfDay(dateRange.to);
            if (!isInDateRange) return false;

            if (filterBySchoolTime) {
                const isInTimeRange = (scoreHour > 8 || (scoreHour === 8 && scoreMinutes >= 45)) &&
                                    (scoreHour < 16 || (scoreHour === 16 && scoreMinutes <= 45));
                return isInTimeRange;
            }
            
            return true;
        }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const columnWidth = (pageWidth - 3 * margin) / 2;
        
        // --- HEADER ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(student.name, pageWidth / 2, 25, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const dateString = `Bilan du ${format(dateRange.from!, 'd MMMM yyyy', { locale: fr })} au ${format(dateRange.to!, 'd MMMM yyyy', { locale: fr })}`;
        doc.text(dateString, pageWidth / 2, 35, { align: 'center' });

        const scoresByCategory: Record<string, Score[]> = {};
        allSkillCategories.forEach(cat => scoresByCategory[cat] = []);
        studentScores.forEach(score => {
            const skill = getSkillBySlug(score.skill);
            if (skill && scoresByCategory[skill.category]) {
                scoresByCategory[skill.category].push(score);
            }
        });
        
        let yPos = 50;
        let currentColumn = 1;

        const renderBlock = (renderer: () => void) => {
            const initialY = yPos;
            const initialCol = currentColumn;
            
            // Render once to get the final Y position from autotable
            renderer();
            const finalY = (doc as any).lastAutoTable.finalY || initialY + 20; // fallback height
            const blockHeight = finalY - initialY;
            
            // Reset to draw for real
            yPos = initialY;
            currentColumn = initialCol;
            (doc as any).lastAutoTable.finalY = initialY;

            if (yPos + blockHeight > pageHeight - margin) {
                if (currentColumn === 1) {
                    currentColumn = 2;
                    yPos = 50;
                } else {
                    doc.addPage();
                    currentColumn = 1;
                    yPos = 50;
                }
            }
            
            renderer();
            yPos = (doc as any).lastAutoTable.finalY + 5;
        };

        for (const category of allSkillCategories) {
            const categoryScores = scoresByCategory[category];
            if (!categoryScores || categoryScores.length === 0) continue;

            // Category Header
            renderBlock(() => {
                 autoTable(doc, {
                    startY: yPos,
                    head: [[{ content: category, styles: { fillColor: PRIMARY_COLOR, fontStyle: 'bold', textColor: '#ffffff' } }]],
                    theme: 'plain', tableWidth: columnWidth, margin: { left: currentColumn === 1 ? margin : margin * 2 + columnWidth },
                });
            });

            for (const score of categoryScores) {
                 renderBlock(() => {
                    const skillName = getSkillBySlug(score.skill)?.name || score.skill;
                    const scoreDate = format(new Date(score.createdAt), 'dd/MM/yy', { locale: fr });
                    const scoreText = score.skill === 'fluence' || score.skill === 'reading-race' ? `${score.score} MCLM` : `${Math.round(score.score)}%`;
                    const level = difficultyLevelToString(score.skill, score.score, score.calculationSettings, score.currencySettings, score.timeSettings, score.calendarSettings, score.numberLevelSettings, score.countSettings);
                    
                    const head = [[
                        { content: `${skillName} - ${scoreDate}`, styles: { fontStyle: 'bold' }},
                        { content: scoreText, styles: { halign: 'center' }},
                        { content: `Niveau ${level}`, styles: { halign: 'right' }}
                    ]];

                    const body = (score.details || []).map(detail => [detail.question, detail.userAnswer]);

                    autoTable(doc, {
                        startY: yPos,
                        head: head,
                        body: body.length > 0 ? body : undefined,
                        theme: body.length > 0 ? 'grid' : 'plain',
                        tableWidth: columnWidth,
                        margin: { left: currentColumn === 1 ? margin : margin * 2 + columnWidth },
                        headStyles: { 
                            fillColor: [245, 245, 245], 
                            textColor: 20, 
                            fontSize: 8, 
                            cellPadding: {top: 1.5, right: 1.5, bottom: 0.5, left: 1.5}
                        },
                        bodyStyles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
                        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 'auto' } },
                        didParseCell: (data) => {
                            if (data.section === 'head') {
                                // Clear default styles for custom layout
                                data.cell.styles.fontStyle = 'normal';
                                data.cell.styles.fontSize = 8;
                            }
                            if (data.section === 'body' && score.details && data.row.index >= 0 && score.details[data.row.index]) {
                                if(score.details[data.row.index].status === 'incorrect'){
                                    data.cell.styles.fillColor = LIGHT_RED_FILL;
                                }
                            }
                        },
                    });
                 });
            }
        }

        if (studentScores.length === 0) {
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text("Aucune donnée de score pour cet élève sur la période sélectionnée.", pageWidth/2, 60, { align: 'center' });
        }
    };
    
    const generateSinglePdf = () => {
        if (!selectedStudentId || !dateRange?.from || !dateRange?.to) return;
        const student = students.find(s => s.id === selectedStudentId);
        if (!student) return;

        const doc = new jsPDF();
        generatePdfForStudent(doc, student, dateRange);
        doc.save(`Bilan-${student.name.replace(' ', '_')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const generateClassPdf = () => {
        if (!dateRange?.from || !dateRange?.to) return;

        const doc = new jsPDF();
        
        students.forEach((student, index) => {
            if (index > 0) {
                doc.addPage();
            }
            generatePdfForStudent(doc, student, dateRange);
        });

        doc.save(`Bilan-Classe-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
                <div className="grid gap-2 w-full sm:w-auto">
                    <Label htmlFor="student-select">Élève</Label>
                    <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''}>
                        <SelectTrigger id="student-select" className="w-full sm:w-48">
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
                                    "w-full sm:w-[280px] justify-start text-left font-normal",
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
                <div className="flex items-center space-x-2 self-end pb-2">
                    <Checkbox id="school-time" checked={filterBySchoolTime} onCheckedChange={(checked) => setFilterBySchoolTime(!!checked)} />
                    <Label htmlFor="school-time" className="text-sm font-medium leading-none">
                        Temps de classe (8h45 - 16h45)
                    </Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto self-end">
                    <Button
                        onClick={generateSinglePdf}
                        disabled={!selectedStudentId || !dateRange?.from || !dateRange?.to}
                        className="w-full sm:w-auto"
                    >
                        <FileDown className="mr-2" />
                        PDF Individuel
                    </Button>
                     <Button
                        onClick={generateClassPdf}
                        disabled={!dateRange?.from || !dateRange?.to}
                        className="w-full sm:w-auto"
                        variant="secondary"
                    >
                        <FileDown className="mr-2" />
                        Bilan de Classe
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
