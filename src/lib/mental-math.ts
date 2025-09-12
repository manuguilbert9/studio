
import type { SkillLevel } from "./skills";
import type { Question } from "./questions";

export interface MentalMathQuestion extends Omit<Question, 'id'|'question'|'level'> {
    id: number;
    question: string;
    answer: number;
    level: SkillLevel;
}

// --- Helper Functions ---

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const emojiPool = ['🍎', '🍌', '🚗', '🍓', '🍊', '🚓', '🚑', '⚽️', '🧸', '⭐'];


// --- Question Generators by Level ---

// Niveau A – Maternelle (GS) - Découverte < 10
const generateLevelA = (): MentalMathQuestion => {
    const type = choice(['addUnits', 'removeUnits', 'complement']);
    let question = '';
    let answer = 0;
    let visuals: { emoji: string; count: number }[] = [];
    const emoji1 = choice(emojiPool);

    switch (type) {
        case 'addUnits': {
            const a = randInt(1, 8);
            const b = randInt(1, 9 - a);
            question = `${a} + ${b} = ?`;
            answer = a + b;
            visuals = [{ emoji: emoji1, count: a }, { emoji: choice(emojiPool.filter(e => e !== emoji1)), count: b }];
            break;
        }
        case 'removeUnits': {
            const a = randInt(3, 9);
            const b = randInt(1, a - 1);
            question = `${a} - ${b} = ?`;
            answer = a - b;
            visuals = [{ emoji: emoji1, count: a }];
            break;
        }
        case 'complement': {
            const target = 10;
            const a = randInt(1, target - 1);
            question = `Combien pour aller de ${a} à ${target} ?`;
            answer = target - a;
            visuals = [{ emoji: emoji1, count: a }];
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'A', visuals };
};

// Niveau B – CP / CE1 - Add/Sub sans retenue, doubles/moitiés
const generateLevelB = (): MentalMathQuestion => {
    const type = choice(['addNoCarry', 'subNoCarry', 'double', 'half', 'tables']);
    let question = '';
    let answer = 0;

    switch (type) {
        case 'addNoCarry': { 
            let a = randInt(10, 80);
            let b = randInt(10, 90 - a);
            if ((a % 10) + (b % 10) >= 10) return generateLevelB();
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'subNoCarry': {
            let a = randInt(20, 99);
            let b = randInt(10, a - 1);
            if ((a % 10) < (b % 10)) return generateLevelB();
            question = `${a} - ${b} = ?`;
            answer = a - b;
            break;
        }
        case 'tables': {
            const a = randInt(1, 10);
            const b = randInt(1, 10);
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'double': {
            const n = randInt(1, 50);
            question = `Le double de ${n} ?`;
            answer = n * 2;
            break;
        }
        case 'half': {
            const n = randInt(1, 50) * 2;
            question = `La moitié de ${n} ?`;
            answer = n / 2;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'B' };
};

// Niveau C – CE2 / CM1 - Add/Sub avec retenue, multiplications
const generateLevelC = (): MentalMathQuestion => {
    const type = choice(['addCarry', 'subCarry', 'multTables', 'multSimple']);
    let question = '';
    let answer = 0;
     switch (type) {
        case 'addCarry': {
            let a = randInt(10, 90);
            let b = randInt(10, 99 - a);
            if ((a % 10) + (b % 10) < 10) return generateLevelC();
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'subCarry': {
            let a = randInt(30, 99);
            let b = randInt(11, a -1);
            if ((a % 10) >= (b % 10)) return generateLevelC();
            question = `${a} - ${b} = ?`;
            answer = a - b;
            break;
        }
        case 'multTables': {
            const a = randInt(2, 10);
            const b = randInt(2, 10);
            question = `${a} × ${b} = ?`;
            answer = a * b;
            break;
        }
        case 'multSimple': {
            const a = randInt(11, 25);
            const b = randInt(2, 5);
            question = `${a} × ${b} = ?`;
            answer = a * b;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'C' };
};

// Niveau D – CM2 / 6e - Grands nombres, divisions, décimaux
const generateLevelD = (): MentalMathQuestion => {
    const type = choice(['multAdvanced', 'divExact', 'addDecimal', 'complement1000']);
    let question = '';
    let answer = 0;
    
    switch(type) {
        case 'multAdvanced': { 
            const a = randInt(11, 30);
            const b = randInt(11, 20);
            question = `${a} × ${b} = ?`;
            answer = a * b;
            break;
        }
        case 'divExact': {
            const b = randInt(2, 12);
            const quotient = randInt(5, 20);
            const a = b * quotient;
            question = `${a} ÷ ${b} = ?`;
            answer = quotient;
            break;
        }
        case 'addDecimal': {
            let a = randInt(1, 500) / 10;
            let b = randInt(1, 500) / 10;
             if (Math.random() > 0.5) { // addition
                question = `${String(a).replace('.',',')} + ${String(b).replace('.',',')} = ?`;
                answer = parseFloat((a + b).toFixed(1));
             } else { // soustraction
                if (a < b) [a, b] = [b, a];
                question = `${String(a).replace('.',',')} - ${String(b).replace('.',',')} = ?`;
                answer = parseFloat((a - b).toFixed(1));
             }
            break;
        }
        case 'complement1000': {
            const a = randInt(100, 999);
            question = `De ${a} pour aller à 1000 ?`;
            answer = 1000 - a;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'D' };
};


export function generateMentalMathQuestions(level: SkillLevel, count: number): MentalMathQuestion[] {
    const generators = {
        'A': generateLevelA,
        'B': generateLevelB,
        'C': generateLevelC,
        'D': generateLevelD,
    };

    const generator = generators[level] || generateLevelB; // Default to B
    const questions: MentalMathQuestion[] = [];
    const questionSet = new Set<string>(); // To avoid duplicate questions

    while (questions.length < count) {
        const newQ = generator();
        if (!questionSet.has(newQ.question)) {
            questionSet.add(newQ.question);
            questions.push(newQ);
        }
    }
    
    return questions;
}
