
import type { SkillLevel } from "./skills";
import { addDays, getDay, format, startOfMonth } from "date-fns";
import { fr } from 'date-fns/locale';

export interface CalendarQuestion {
    id: number;
    level: SkillLevel;
    type: 'qcm' | 'click-date' | 'count-days';
    question: string;
    // For QCM
    options?: string[];
    answer?: string;
    // For click-date
    month?: Date;
    answerDate?: Date;
    highlightedDays?: Date[];
}

const daysOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const months = Array.from({length: 12}, (_, i) => new Date(2024, i, 1));


// --- Question Generators by Level ---

const generateLevelA = (): CalendarQuestion => {
    const today = new Date();
    // getDay returns 0 for Sunday, 1 for Monday etc.
    const todayIndex = getDay(today);
    
    const type = Math.random() > 0.5 ? 'hier' : 'demain';

    if(type === 'demain') {
        const tomorrowIndex = (todayIndex + 1) % 7;
        const answer = daysOfWeek[tomorrowIndex];
        const options = new Set([answer]);
        while(options.size < 3) {
            options.add(daysOfWeek[Math.floor(Math.random() * 7)]);
        }
        return {
            id: Date.now() + Math.random(),
            level: 'A',
            type: 'qcm',
            question: `Si aujourd'hui on est ${daysOfWeek[todayIndex]}, quel jour serons-nous demain ?`,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            answer: answer,
        }
    } else { // hier
        const yesterdayIndex = (todayIndex + 6) % 7;
        const answer = daysOfWeek[yesterdayIndex];
        const options = new Set([answer]);
        while(options.size < 3) {
            options.add(daysOfWeek[Math.floor(Math.random() * 7)]);
        }
        return {
            id: Date.now() + Math.random(),
            level: 'A',
            type: 'qcm',
            question: `Si aujourd'hui on est ${daysOfWeek[todayIndex]}, quel jour étions-nous hier ?`,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            answer: answer,
        }
    }
};

const generateLevelB = (): CalendarQuestion => {
    const monthDate = months[Math.floor(Math.random() * 12)];
    const day = Math.floor(Math.random() * 28) + 1; // Avoid complexity of month ends
    const answerDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const monthName = format(monthDate, 'MMMM', { locale: fr });
    
    return {
        id: Date.now() + Math.random(),
        level: 'B',
        type: 'click-date',
        question: `Sur le calendrier, clique sur le ${day} ${monthName}.`,
        month: startOfMonth(answerDate),
        answerDate: answerDate,
    };
};

const generateLevelC = (): CalendarQuestion => {
    return generateLevelB(); // Placeholder
};
const generateLevelD = (): CalendarQuestion => {
    return generateLevelB(); // Placeholder
};


export function generateCalendarQuestions(level: SkillLevel, count: number): CalendarQuestion[] {
    const generators = {
        'A': generateLevelA,
        'B': generateLevelB,
        'C': generateLevelC,
        'D': generateLevelD,
    };

    const generator = generators[level] || generateLevelA;
    const questions: CalendarQuestion[] = [];
    const questionSet = new Set<string>();

    while (questions.length < count) {
        const newQ = generator();
        if (!questionSet.has(newQ.question)) {
            questionSet.add(newQ.question);
            questions.push(newQ);
        }
    }
    
    return questions;
}
