
import type { SkillLevel } from "./skills";
import { addDays, getDay, format, startOfMonth, lastDayOfMonth, differenceInDays } from "date-fns";
import { fr } from 'date-fns/locale';

export interface CalendarQuestion {
    id: number;
    level: SkillLevel;
    type: 'qcm' | 'click-date' | 'count-days';
    question: string;
    description?: string;
    // For QCM
    options?: string[];
    answer?: string;
    // For click-date
    month?: Date;
    answerDate?: Date;
    highlightedDays?: Date[];
    // For count-days
    answerNumber?: number;
}

const daysOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const months = Array.from({length: 12}, (_, i) => new Date(2024, i, 1));


// --- Question Generators by Level ---

const generateLevelA = (): CalendarQuestion => {
    const questionType = Math.random();

    // Type 1: Hier / Demain
    if (questionType < 0.5) {
        const today = new Date();
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
    }
    // Type 2: Which day is it?
    else {
        const monthDate = months[Math.floor(Math.random() * 12)];
        const day = Math.floor(Math.random() * 28) + 1; 
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const answer = daysOfWeek[getDay(date)];
        const monthName = format(date, 'MMMM', { locale: fr });

        const options = new Set([answer]);
        while(options.size < 4) {
            options.add(daysOfWeek[Math.floor(Math.random() * 7)]);
        }

        return {
            id: Date.now() + Math.random(),
            level: 'A',
            type: 'qcm',
            question: `Le ${day} ${monthName}, c'est quel jour de la semaine ?`,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            answer: answer
        }
    }
};

const generateLevelB = (): CalendarQuestion => {
    const questionType = Math.random();

    // Type 1: Find a date
    if (questionType < 0.5) {
        const monthDate = months[Math.floor(Math.random() * 12)];
        const day = Math.floor(Math.random() * 28) + 1;
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
    }
    // Type 2: Order of days
    else {
        const monthDate = months[Math.floor(Math.random() * 12)];
        const day1 = Math.floor(Math.random() * 20) + 1; // Start early in the month
        const date1 = new Date(monthDate.getFullYear(), monthDate.getMonth(), day1);
        const dayOfWeek1 = daysOfWeek[getDay(date1)];
        
        const dayOffset = Math.floor(Math.random() * 4) + 2; // 2-5 days later
        const date2 = addDays(date1, dayOffset);
        const day2 = date2.getDate();
        const answer = daysOfWeek[getDay(date2)];

        const options = new Set([answer]);
        while(options.size < 4) {
            options.add(daysOfWeek[Math.floor(Math.random() * 7)]);
        }

        return {
            id: Date.now() + Math.random(),
            level: 'B',
            type: 'qcm',
            question: `Le ${day1} ${format(date1, 'MMMM', {locale:fr})} tombe un ${dayOfWeek1}. Quel jour sera le ${day2} ?`,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            answer: answer
        }
    }
};

const generateLevelC = (): CalendarQuestion => {
    const questionType = Math.random();

    // Type 1: Find date by clues
    if (questionType < 0.5) {
        const monthDate = months[Math.floor(Math.random() * 12)];
        const monthName = format(monthDate, 'MMMM', { locale: fr });
        const dayOfWeekIndex = Math.floor(Math.random() * 5) + 1; // Monday to Friday
        const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
        const weekNumber = Math.floor(Math.random() * 3) + 1; // 1st, 2nd or 3rd
        const weekNumberText = ['premier', 'deuxième', 'troisième'][weekNumber - 1];

        // Find the date
        let date = startOfMonth(monthDate);
        let count = 0;
        while(count < weekNumber) {
            if (getDay(date) === dayOfWeekIndex) {
                count++;
            }
            if (count < weekNumber) {
                date = addDays(date, 1);
            }
        }

        return {
            id: Date.now() + Math.random(),
            level: 'C',
            type: 'click-date',
            question: `Trouve le ${weekNumberText} ${dayOfWeekName} du mois de ${monthName}.`,
            month: startOfMonth(monthDate),
            answerDate: date
        };
    } 
    // Type 2: How many days in the month?
    else {
        const monthDate = months[Math.floor(Math.random() * 12)];
        const monthName = format(monthDate, 'MMMM', { locale: fr });
        const answer = differenceInDays(lastDayOfMonth(monthDate), startOfMonth(monthDate)) + 1;

        return {
            id: Date.now() + Math.random(),
            level: 'C',
            type: 'count-days',
            question: `Combien de jours y a-t-il dans le mois de ${monthName} ?`,
            description: `Aide-toi du calendrier pour compter.`,
            month: startOfMonth(monthDate),
            answerNumber: answer
        }
    }
};

const generateLevelD = (): CalendarQuestion => {
    return generateLevelC(); // Placeholder
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
