
import type { SkillLevel } from "./skills";

export interface MentalMathQuestion {
    id: number;
    question: string;
    answer: number;
    level: SkillLevel;
}

// --- Helper Functions ---

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

// --- Question Generators by Level ---

// Niveau A – Maternelle (fin GS, simplifié)
const generateLevelA = (): MentalMathQuestion => {
    const type = choice(['add1', 'sub1', 'add2', 'sub2', 'nextNumber']);
    let question = '';
    let answer = 0;

    switch (type) {
        case 'add1': {
            const n = randInt(1, 18);
            question = `${n} + 1 = ?`;
            answer = n + 1;
            break;
        }
        case 'sub1': {
            const n = randInt(2, 20);
            question = `${n} - 1 = ?`;
            answer = n - 1;
            break;
        }
        case 'add2': {
             const n = randInt(1, 10);
             question = `${n} + 2 = ?`;
             answer = n + 2;
             break;
        }
        case 'sub2': {
             const n = randInt(3, 15);
             question = `${n} - 2 = ?`;
             answer = n - 2;
             break;
        }
        case 'nextNumber': {
            const n = randInt(1, 18);
            question = `Quel nombre vient après ${n} ?`;
            answer = n + 1;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'A' };
};

// Niveau B – CP / CE1 (simplifié)
const generateLevelB = (): MentalMathQuestion => {
    const type = choice(['addNoCarry', 'subNoCarry', 'double', 'half', 'mult2', 'mult5']);
    let question = '';
    let answer = 0;

    switch (type) {
        case 'addNoCarry': {
            const n1 = randInt(10, 40);
            const n2 = randInt(1, 9);
            question = `${n1} + ${n2} = ?`;
            answer = n1 + n2;
            break;
        }
        case 'subNoCarry': {
            const n1 = randInt(20, 50);
            const n2 = randInt(1, Math.min(9, n1 - 11));
            question = `${n1} - ${n2} = ?`;
            answer = n1 - n2;
            break;
        }
        case 'double': {
            const n = randInt(2, 10);
            question = `Le double de ${n} ?`;
            answer = n * 2;
            break;
        }
        case 'half': {
            const n = randInt(2, 10) * 2;
            question = `La moitié de ${n} ?`;
            answer = n / 2;
            break;
        }
        case 'mult2': {
            const n = randInt(1, 10);
            question = `${n} × 2 = ?`;
            answer = n * 2;
            break;
        }
        case 'mult5': {
            const n = randInt(1, 10);
            question = `${n} × 5 = ?`;
            answer = n * 5;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'B' };
};

// Niveau C – CE2 / CM1 (simplifié)
const generateLevelC = (): MentalMathQuestion => {
    const type = choice(['add', 'sub', 'mult', 'div10', 'share']);
    let question = '';
    let answer = 0;
     switch (type) {
        case 'add': {
            const n1 = randInt(100, 400);
            const n2 = randInt(100, 400);
            question = `${n1} + ${n2} = ?`;
            answer = n1 + n2;
            break;
        }
        case 'sub': {
            const n1 = randInt(200, 500);
            const n2 = randInt(100, n1 - 100);
            question = `${n1} - ${n2} = ?`;
            answer = n1 - n2;
            break;
        }
        case 'mult': {
            const n1 = randInt(2, 7);
            const n2 = randInt(2, 9);
            question = `${n1} × ${n2} = ?`;
            answer = n1 * n2;
            break;
        }
        case 'div10': {
            const n = randInt(2, 50) * 10;
            question = `${n} ÷ 10 = ?`;
            answer = n / 10;
            break;
        }
        case 'share': {
            const divisor = choice([2, 3, 4, 5]);
            const res = randInt(5, 20);
            const dividend = res * divisor;
            question = `Combien de fois ${divisor} dans ${dividend} ?`;
            answer = res;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'C' };
};

// Niveau D – CM2 / 6ème (simplifié)
const generateLevelD = (): MentalMathQuestion => {
    const type = choice(['multInt', 'addDecimal', 'subDecimal', 'divInt', 'prop']);
    let question = '';
    let answer = 0;
    
    switch(type) {
        case 'multInt': {
            const n1 = randInt(101, 999);
            const n2 = randInt(2, 9);
            question = `${n1} × ${n2} = ?`;
            answer = n1 * n2;
            break;
        }
        case 'addDecimal': {
            const n1 = randInt(10, 50) / 10;
            const n2 = randInt(10, 50) / 10;
            question = `${String(n1).replace('.', ',')} + ${String(n2).replace('.', ',')} = ?`;
            answer = parseFloat((n1 + n2).toFixed(1));
            break;
        }
        case 'subDecimal': {
            let n1 = randInt(20, 80) / 10;
            let n2 = randInt(10, 70) / 10;
            if (n1 < n2) [n1, n2] = [n2, n1];
            question = `${String(n1).replace('.', ',')} - ${String(n2).replace('.', ',')} = ?`;
            answer = parseFloat((n1 - n2).toFixed(1));
            break;
        }
        case 'divInt': {
            const divisor = randInt(2, 9);
            const res = randInt(10, 50);
            const dividend = divisor * res;
            question = `${dividend} ÷ ${divisor} = ?`;
            answer = res;
            break;
        }
        case 'prop': {
            const operation = choice(['double', 'half']);
            if (operation === 'half') {
                const n = randInt(10, 100) * 2;
                question = `La moitié de ${n} ?`;
                answer = n / 2;
            } else { // double
                const n = randInt(20, 200);
                question = `Le double de ${n} ?`;
                answer = n * 2;
            }
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
