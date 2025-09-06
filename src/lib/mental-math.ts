
import type { SkillLevel } from "./skills";

export interface MentalMathQuestion {
    id: number;
    question: string;
    answer: number;
    level: SkillLevel;
    visuals?: { emoji: string; count: number }[];
}

// --- Helper Functions ---

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const emojiPool = ['🍎', '🍌', '🚗', '🍓', '🍊', '🚓', '🚑', '⚽️', '🧸', '⭐'];


// --- Question Generators by Level ---

// Niveau A – Maternelle (GS)
const generateLevelA = (): MentalMathQuestion => {
    const type = choice(['addUnits', 'removeUnits', 'complement']);
    let question = '';
    let answer = 0;
    let visuals: { emoji: string; count: number }[] = [];
    const emoji1 = choice(emojiPool);

    switch (type) {
        case 'addUnits': {
            const a = randInt(1, 5);
            const b = randInt(1, 4);
            const result = a + b;
            if (result > 9) {
                return generateLevelA(); // Recurse to get a valid question
            }
            const emoji2 = choice(emojiPool.filter(e => e !== emoji1));
            question = `${a} + ${b} = ?`;
            answer = result;
            visuals = [{ emoji: emoji1, count: a }, { emoji: emoji2, count: b }];
            break;
        }
        case 'removeUnits': {
            const a = randInt(2, 9);
            const b = randInt(1, a - 1);
            question = `${a} - ${b} = ?`;
            answer = a - b;
            visuals = [{ emoji: emoji1, count: a }];
            break;
        }
        case 'complement': {
            const target = choice([5, 10]);
            const a = randInt(1, target - 1);
            question = `Combien pour aller de ${a} à ${target} ?`;
            answer = target - a;
            visuals = [{ emoji: emoji1, count: a }];
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'A', visuals };
};

// Niveau B – CP / CE1
const generateLevelB = (): MentalMathQuestion => {
    const type = choice(['addNoCarry', 'addCarry', 'subNoCarry', 'subCarry', 'tables', 'multTables', 'double', 'half']);
    let question = '';
    let answer = 0;

    switch (type) {
        case 'addNoCarry': { // a + b avec a, b ∈ [1,20], résultat ≤ 30.
            let a = randInt(1, 20);
            let b = randInt(1, 20);
            if (a + b > 30 || (a % 10) + (b % 10) >= 10) {
                 return generateLevelB();
            }
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'addCarry': { // a + b avec a, b ∈ [10,90], résultat ≤ 100.
            let a = randInt(10, 90);
            let b = randInt(10, 90);
            if (a + b > 100 || (a % 10) + (b % 10) < 10) {
                return generateLevelB();
            }
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'subNoCarry': { // a – b avec a ∈ [1,30], b ∈ [1,a].
            let a = randInt(11, 30); // start from 11 to avoid trivial subtractions
            let b = randInt(1, a - 1);
             if ((a % 10) < (b % 10)) {
                return generateLevelB();
            }
            question = `${a} - ${b} = ?`;
            answer = a - b;
            break;
        }
        case 'subCarry': { // a – b avec a, b ∈ [20,99], résultat ≥ 0.
            let a = randInt(20, 99);
            let b = randInt(20, a -1);
            if ((a % 10) >= (b % 10)) {
                return generateLevelB();
            }
            question = `${a} - ${b} = ?`;
            answer = a - b;
            break;
        }
        case 'tables': { // a + b avec a, b ∈ [0,10].
            const a = randInt(0, 10);
            const b = randInt(0, 10);
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'multTables': { // a × b avec a ∈ [0,10], b ∈ [0,10].
            const a = randInt(0, 10);
            const b = randInt(0, 10);
            question = `${a} × ${b} = ?`;
            answer = a * b;
            break;
        }
        case 'double': { // double d’un nombre ∈ [1,50]
            const n = randInt(1, 50);
            question = `Le double de ${n} ?`;
            answer = n * 2;
            break;
        }
        case 'half': { // moitié d’un nombre pair ∈ [2,100]
            const n = randInt(1, 50) * 2;
            question = `La moitié de ${n} ?`;
            answer = n / 2;
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'B' };
};

// Niveau C – CE2 / CM1
const generateLevelC = (): MentalMathQuestion => {
    const type = choice(['add', 'sub', 'mult', 'mult100', 'div', 'complement', 'double', 'half', 'distributive']);
    let question = '';
    let answer = 0;
     switch (type) {
        case 'add': { // a + b avec a, b ∈ [100,900], résultat ≤ 1 000.
            const a = randInt(100, 900);
            const b = randInt(100, 1000 - a);
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
        case 'sub': { // a – b avec a ∈ [100,1 000], b ∈ [1,a].
            const a = randInt(100, 1000);
            const b = randInt(1, a);
            question = `${a} - ${b} = ?`;
            answer = a - b;
            break;
        }
        case 'mult': { // a × b avec a ∈ [2,20], b ∈ [2,20], résultat ≤ 400.
            let a = randInt(2, 20);
            let b = randInt(2, 20);
            if (a*b > 400) return generateLevelC();
            question = `${a} × ${b} = ?`;
            answer = a * b;
            break;
        }
        case 'mult100': { // a × 10/100/1 000 avec a ∈ [1,1 000]
            const a = randInt(1, 1000);
            const m = choice([10, 100, 1000]);
            question = `${a} × ${m} = ?`;
            answer = a * m;
            break;
        }
        case 'div': { // a ÷ b avec a ∈ [20,200], b ∈ [2,10], quotient entier.
            const b = randInt(2, 10);
            const quotient = randInt(Math.ceil(20/b), Math.floor(200/b));
            const a = b * quotient;
            question = `${a} ÷ ${b} = ?`;
            answer = quotient;
            break;
        }
        case 'complement': { // trouver ce qui manque pour atteindre 100 ou 1 000 (a ∈ [1,999]).
            const target = choice([100, 1000]);
            const a = randInt(1, target -1);
            question = `Combien manque-t-il à ${a} pour faire ${target} ?`;
            answer = target - a;
            break;
        }
        case 'double': { // double d’un nombre ∈ [1,500],
            const n = randInt(1, 500);
            question = `Le double de ${n} ?`;
            answer = n * 2;
            break;
        }
        case 'half': { // moitié d’un nombre pair ∈ [2,1 000].
            const n = randInt(1, 500) * 2;
            question = `La moitié de ${n} ?`;
            answer = n / 2;
            break;
        }
        case 'distributive': { // 49+36 → 50+35 ou 25×16 → (25×10)+(25×6)
            if (Math.random() > 0.5) { // Addition
                let a = randInt(20, 80);
                if (a % 10 === 0) a++; // ensure it's not a round number
                const b = randInt(20, 80);
                question = `${a} + ${b} = ?`;
                answer = a + b;
            } else { // Multiplication
                const a = choice([15, 25, 35]);
                const b = randInt(11, 19);
                question = `${a} × ${b} = ?`;
                answer = a * b;
            }
            break;
        }
    }
    return { id: Date.now() + Math.random(), question, answer, level: 'C' };
};

// Niveau D – CM2 / 6e
const generateLevelD = (): MentalMathQuestion => {
    const type = choice(['add', 'sub', 'mult', 'multDecimal', 'divInt', 'divDecimal', 'complement', 'double', 'half', 'triple', 'quarter', 'fraction', 'addDecimal']);
    let question = '';
    let answer = 0;
    
    switch(type) {
        case 'add': { // a + b avec a, b ∈ [1 000, 100 000], résultat ≤ 1 000 000
            const a = randInt(1000, 100000);
            const b = randInt(1000, 1000000 - a);
            question = `${a} + ${b} = ?`;
            answer = a + b;
            break;
        }
         case 'sub': { // a – b avec a ∈ [1 000,1 000 000], b ∈ [1,a].
            const a = randInt(1000, 1000000);
            const b = randInt(1, a);
            question = `${a} - ${b} = ?`;
            answer = a - b;
            break;
        }
        case 'mult': { // a × b avec a ∈ [2,100], b ∈ [2,100].
            const a = randInt(2, 100);
            const b = randInt(2, 100);
            question = `${a} × ${b} = ?`;
            answer = a * b;
            break;
        }
        case 'multDecimal': { // Multiplication par 0,1 ; 0,5 ; 10 ; 100 ; 1 000.
            const a = randInt(10, 500);
            const m = choice([0.1, 0.5, 10, 100, 1000]);
            question = `${a} × ${String(m).replace('.',',')} = ?`;
            answer = a * m;
            break;
        }
        case 'divInt': { // a ÷ b avec a ∈ [100,10 000], b ∈ [2,20].
            const b = randInt(2, 20);
            const quotient = randInt(Math.ceil(100/b), Math.floor(10000/b));
            const a = b * quotient;
            question = `${a} ÷ ${b} = ?`;
            answer = quotient;
            break;
        }
        case 'divDecimal': { // a ÷ b avec a ∈ [10,100], b ∈ {2,4,5,10} (résultats décimaux exacts).
            const b = choice([2, 4, 5, 10]);
            let a = randInt(10, 100);
            if ((a/b) % 1 === 0) a++; // ensure it's not a perfect division
            question = `${a} ÷ ${b} = ?`;
            answer = a / b;
            break;
        }
        case 'complement': { // Compléments à 100 / 1 000 / 10 000.
            const target = choice([100, 1000, 10000]);
            const a = randInt(1, target -1);
            question = `De ${a} pour aller à ${target} ?`;
            answer = target - a;
            break;
        }
        case 'double': { // double jusqu'à 10 000
            const n = randInt(1, 10000);
            question = `Double de ${n} ?`;
            answer = n * 2;
            break;
        }
        case 'half': { // moitié jusqu'à 10 000
            const n = randInt(1, 5000) * 2;
            question = `Moitié de ${n} ?`;
            answer = n / 2;
            break;
        }
         case 'triple': { // triple jusqu'à 1 000
            const n = randInt(1, 1000);
            question = `Triple de ${n} ?`;
            answer = n * 3;
            break;
        }
         case 'quarter': { // quart jusqu'à 1 000
            const n = randInt(1, 250) * 4;
            question = `Quart de ${n} ?`;
            answer = n / 4;
            break;
        }
        case 'fraction': { // ½, ⅓, ¼ d’un nombre ≤ 1 000.
            const frac = choice([2, 3, 4]);
            const n = randInt(1, Math.floor(1000 / frac)) * frac;
            const fracSymbol = frac === 2 ? '½' : '⅓'
            question = `Le ${fracSymbol} de ${n} ?`;
            answer = n / frac;
            break;
        }
        case 'addDecimal': { // additions/soustractions avec un chiffre après la virgule
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
