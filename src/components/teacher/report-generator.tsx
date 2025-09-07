
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, FileDown, CheckCircle, XCircle } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Student } from '@/services/students';
import { type Score, CalculationState, ScoreDetail } from '@/services/scores';
import { type SpellingProgress } from '@/services/spelling';
import { getSkillBySlug, difficultyLevelToString, allSkillCategories } from '@/lib/skills';

const PRIMARY_COLOR = '#ea588b';
const GREEN_COLOR = '#16a34a';
const RED_COLOR = '#dc2626';
const HEADING_FONT_SIZE = 14;
const BASE_FONT_SIZE = 9;
const SMALL_FONT_SIZE = 8;
const WIDGET_FONT_SIZE = 6;


interface ReportGeneratorProps {
    students: Student[];
    allScores: Score[];
    allSpellingProgress: SpellingProgress[];
}

// --- PDF Drawing Helpers ---

const drawCalculationWidget = (doc: jsPDF, detail: ScoreDetail, startX: number, startY: number): { endX: number, endY: number } => {
    if (!detail.calculationState) {
        return { endX: startX, endY: startY };
    }

    const state = detail.calculationState;
    const isAddition = detail.question.includes('+');
    const operands = detail.question.split(/[+-]/).map(s => s.trim());
    const numCols = Math.max(...operands.map(op => op.length), detail.correctAnswer.length);

    const CELL_SIZE = 8;
    const FONT_SIZE = WIDGET_FONT_SIZE;
    const CARRY_FONT_SIZE = WIDGET_FONT_SIZE - 1;
    let y = startY;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const widgetStartX = startX;

    // Draw carry cells (subtraction)
    if (!isAddition) {
        let x = widgetStartX + CELL_SIZE * (numCols > operands[0].length ? 1.5 : 0.5);
        for (let i = 0; i < numCols - 1; i++) {
            const colFromRight = numCols - 1 - i;
            const id = `carry-${colFromRight}`;
            const cellState = state[id];
            doc.setDrawColor(200);
            doc.rect(x + 1, y, CELL_SIZE-2, CELL_SIZE-2, 'S');
            if (cellState?.value) {
                doc.text(cellState.value, x + CELL_SIZE/2, y + CELL_SIZE/2 + 1, { align: 'center' });
            }
            x += CELL_SIZE;
        }
        y += CELL_SIZE;
    }

    // Draw operands
    operands.forEach((operand) => {
        let x = widgetStartX;
        doc.text(isAddition ? '+' : '-', x, y + CELL_SIZE/2 + 1);
        x += CELL_SIZE / 2;
        
        const paddedOperand = operand.padStart(numCols, ' ');

        for (let i = 0; i < numCols; i++) {
            const digit = paddedOperand[i];
            doc.setDrawColor(150);
            doc.rect(x, y, CELL_SIZE, CELL_SIZE, 'S');
            doc.setFontSize(FONT_SIZE);
            doc.text(digit, x + CELL_SIZE/2, y + CELL_SIZE/2 + 2, { align: 'center' });
            x += CELL_SIZE;
        }
        y += CELL_SIZE;
    });

    // Draw separator line
    doc.setLineWidth(0.5);
    doc.line(widgetStartX + CELL_SIZE/2, y, widgetStartX + CELL_SIZE/2 + numCols * CELL_SIZE, y);
    y += 2;

    // Draw result
    let xResult = widgetStartX + CELL_SIZE / 2;
    const paddedResult = (detail.userAnswer || '').padStart(numCols, ' ');
    for (let i = 0; i < numCols; i++) {
        const digit = paddedResult[i];
        doc.setDrawColor(150);
        doc.rect(xResult, y, CELL_SIZE, CELL_SIZE, 'S');
        if (digit !== ' ') {
            doc.setFontSize(FONT_SIZE);
            doc.text(digit, xResult + CELL_SIZE / 2, y + CELL_SIZE / 2 + 2, { align: 'center' });
        }
        xResult += CELL_SIZE;
    }
    y += CELL_SIZE;

    // Draw carry cells (addition)
    if (isAddition) {
         let x = widgetStartX + CELL_SIZE / 2;
         for (let i = 0; i < numCols; i++) {
            const colFromRight = numCols - 1 - i;
            const id = `carry-${colFromRight}`;
            const cellState = state[id];
            if(cellState?.value) {
                doc.setFontSize(CARRY_FONT_SIZE);
                doc.text(cellState.value, x + CELL_SIZE, startY + 4 + (operands.length * CELL_SIZE) - 2, {align: 'center'});
            }
            x += CELL_SIZE;
        }
    }

    const widgetWidth = (numCols + 1.5) * CELL_SIZE;
    return { endX: startX + widgetWidth, endY: y };
};


export function ReportGenerator({ students, allScores, allSpellingProgress }: ReportGeneratorProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });
    
    const generatePdfForStudent = (doc: jsPDF, student: Student, dateRange: DateRange) => {
        const studentScores = allScores.filter(s =>
            s.userId === student.id &&
            new Date(s.createdAt) >= dateRange.from! &&
            new Date(s.createdAt) <= dateRange.to!
        ).sort((a, b) => a.skill.localeCompare(b.skill));

        // --- HEADER ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(student.name, 105, 25, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const dateString = `Bilan du ${format(dateRange.from!, 'd MMMM yyyy', { locale: fr })} au ${format(dateRange.to!, 'd MMMM yyyy', { locale: fr })}`;
        doc.text(dateString, 105, 35, { align: 'center' });

        let yPos = 50;

        const scoresByCategory: Record<string, Score[]> = {};
        allSkillCategories.forEach(cat => scoresByCategory[cat] = []);
        studentScores.forEach(score => {
            const skill = getSkillBySlug(score.skill);
            if (skill && scoresByCategory[skill.category]) {
                scoresByCategory[skill.category].push(score);
            }
        });

        let hasContent = false;
        for (const category of allSkillCategories) {
            const categoryScores = scoresByCategory[category] || [];
            if (categoryScores.length === 0) continue;
            hasContent = true;

            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            autoTable(doc, {
                startY: yPos,
                head: [[{ content: category, styles: { fillColor: PRIMARY_COLOR, fontStyle: 'bold', textColor: '#ffffff' } }]],
                theme: 'plain',
            });
            yPos = (doc as any).lastAutoTable.finalY + 2;
            
            for (const score of categoryScores) {
                 if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                const skill = getSkillBySlug(score.skill);
                const scoreText = score.skill === 'reading-race' ? `${score.score} MCLM` : `${Math.round(score.score)} %`;
                const level = difficultyLevelToString(score.skill, score.score, score.calculationSettings, score.currencySettings, score.timeSettings, score.calendarSettings, score.numberLevelSettings, score.countSettings, score.readingRaceSettings);
                const date = format(new Date(score.createdAt), 'dd/MM/yy HH:mm');
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`${skill?.name || score.skill}`, 14, yPos);
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(BASE_FONT_SIZE);
                doc.text(`Score: ${scoreText}`, 100, yPos, {align: 'left'});
                doc.text(`Niveau: ${level || 'N/A'}`, 140, yPos, {align: 'left'});
                doc.text(date, 200, yPos, {align: 'right'});
                yPos += 5;


                if (score.skill === 'long-calculation' && score.details && score.details.length > 0) {
                    yPos += 4;
                    let currentX = 14;
                    let maxWidgetY = yPos;
                    score.details.forEach((detail, index) => {
                        const widgetWidth = (String(detail.correctAnswer).length + 2) * 8;
                        if (currentX + widgetWidth > 200) { // Check if it fits on the line
                            currentX = 14;
                            yPos = maxWidgetY + 4;
                        }
                        if (yPos > 220) { // Check space before drawing widget
                            doc.addPage();
                            yPos = 20;
                            currentX = 14;
                        }
                        
                        doc.setFontSize(SMALL_FONT_SIZE);
                        doc.text(detail.status === 'correct' ? 'Correct' : 'Incorrect', currentX, yPos - 2);

                        const { endX, endY } = drawCalculationWidget(doc, detail, currentX, yPos);
                        currentX = endX + 8; // Update X for next widget
                        maxWidgetY = Math.max(maxWidgetY, endY);
                    });
                    yPos = maxWidgetY + 5;
                } else if (score.details && score.details.length > 0) {
                    const hasOptionsColumn = score.details.some(d => d.options && d.options.length > 0);
                    const hasMistakesColumn = score.details.some(d => d.mistakes && d.mistakes.length > 0);
                    const shouldShowCorrectAnswer = score.skill !== 'simple-word-reading' && score.skill !== 'ecoute-les-nombres' && score.skill !== 'nombres-complexes' && score.skill !== 'lire-les-nombres';

                    const headers: string[] = ['Question', 'Réponse'];
                    if (hasOptionsColumn) headers.push('Options proposées');
                    if (shouldShowCorrectAnswer) headers.push('Bonne réponse');
                    if (hasMistakesColumn) headers.push('Erreurs');
                    headers.push('Statut');

                    const body = score.details.map(detail => {
                        const row = [detail.question, detail.userAnswer];
                        if (hasOptionsColumn) row.push(detail.options?.join(', ') || '-');
                        if (shouldShowCorrectAnswer) row.push(detail.correctAnswer);
                        if (hasMistakesColumn) row.push(detail.mistakes?.join(', ') || '-');
                        row.push(detail.status === 'correct' ? 'Correct' : 'Incorrect');
                        return row;
                    });

                    autoTable(doc, {
                        startY: yPos,
                        head: [headers],
                        body: body,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [230, 230, 230],
                            textColor: 20,
                            fontSize: SMALL_FONT_SIZE - 1,
                        },
                        styles: {
                            fontSize: SMALL_FONT_SIZE - 1,
                            cellPadding: 1.5,
                        },
                        didParseCell: (data) => {
                            if (data.column.dataKey === headers.length - 1) { // Status column
                                if (data.cell.raw === 'Correct') {
                                    data.cell.styles.textColor = GREEN_COLOR;
                                } else {
                                    data.cell.styles.textColor = RED_COLOR;
                                }
                            }
                        }
                    });
                     yPos = (doc as any).lastAutoTable.finalY + 5;
                } else {
                     yPos += 2; // Add a small gap
                }
            }
             yPos += 5;
        }

        if (!hasContent) {
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text("Aucune donnée de score pour cet élève sur la période sélectionnée.", 105, 60, { align: 'center' });
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

    