
import type { SkillLevel } from "./skills";
import { addDays, getDay, format, startOfMonth, lastDayOfMonth, differenceInDays } from "date-fns";
import { fr } from 'date-fns/locale';
import { getCurrentSchoolYear } from "@/services/teacher";

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

// --- Utility function to get a random date within the current school year ---
async function getRandomDateInSchoolYear(): Promise<Date> {
    const yearStr = await getCurrentSchoolYear();
    const startYear = parseInt(yearStr, 10);

    // School year starts on Sept 1st
    const startDate = new Date(startYear, 8, 1); 
    // Ends 365 days later
    const randomDayOffset = Math.floor(Math.random() * 365);
    
    return addDays(startDate, randomDayOffset);
}

// --- Question Generators by Level ---

const generateLevelA = async (): Promise<CalendarQuestion> => {
    const questionType = Math.random();
    const referenceDate = await getRandomDateInSchoolYear();

    // Type 1: Hier / Demain
    if (questionType < 0.5) {
        const todayIndex = getDay(referenceDate);
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
        const day = referenceDate.getDate();
        const answer = daysOfWeek[getDay(referenceDate)];
        const monthName = format(referenceDate, 'MMMM', { locale: fr });

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

const generateLevelB = async (): Promise<CalendarQuestion> => {
    const questionType = Math.random();
    const referenceDate = await getRandomDateInSchoolYear();

    // Type 1: Find a date
    if (questionType < 0.5) {
        const day = referenceDate.getDate();
        const monthName = format(referenceDate, 'MMMM', { locale: fr });
        
        return {
            id: Date.now() + Math.random(),
            level: 'B',
            type: 'click-date',
            question: `Sur le calendrier, clique sur le ${day} ${monthName}.`,
            month: startOfMonth(referenceDate),
            answerDate: referenceDate,
        };
    }
    // Type 2: Order of days
    else {
        const date1 = referenceDate;
        // ensure date1 is not too close to the end of the month for this question type
        if(date1.getDate() > 25) {
            date1.setDate(15);
        }
        const day1 = date1.getDate();
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

const generateLevelC = async (): Promise<CalendarQuestion> => {
    const questionType = Math.random();
    const referenceDate = await getRandomDateInSchoolYear();

    // Type 1: Find date by clues
    if (questionType < 0.5) {
        const monthName = format(referenceDate, 'MMMM', { locale: fr });
        const dayOfWeekIndex = Math.floor(Math.random() * 5) + 1; // Monday to Friday
        const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
        const weekNumber = Math.floor(Math.random() * 3) + 1; // 1st, 2nd or 3rd
        const weekNumberText = ['premier', 'deuxième', 'troisième'][weekNumber - 1];

        // Find the date
        let date = startOfMonth(referenceDate);
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
            month: startOfMonth(referenceDate),
            answerDate: date
        };
    } 
    // Type 2: How many days in the month?
    else {
        const monthName = format(referenceDate, 'MMMM', { locale: fr });
        const answer = differenceInDays(lastDayOfMonth(referenceDate), startOfMonth(referenceDate)) + 1;

        return {
            id: Date.now() + Math.random(),
            level: 'C',
            type: 'count-days',
            question: `Combien de jours y a-t-il dans le mois de ${monthName} ?`,
            description: `Aide-toi du calendrier pour compter.`,
            month: startOfMonth(referenceDate),
            answerNumber: answer
        }
    }
};

const generateLevelD = async (): Promise<CalendarQuestion> => {
    return generateLevelC(); // Placeholder - For now, Level D uses Level C questions
};


export async function generateCalendarQuestions(level: SkillLevel, count: number): Promise<CalendarQuestion[]> {
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
        const newQ = await generator();
        if (!questionSet.has(newQ.question)) {
            questionSet.add(newQ.question);
            questions.push(newQ);
        }
    }
    
    return questions;
}
