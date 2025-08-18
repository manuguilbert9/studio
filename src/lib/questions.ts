
export interface Question {
  question: string;
  options: string[];
  answer: string;
  image?: string | null;
  hint?: string;
  hour?: number;
  minute?: number;
}

export interface CalculationSettings {
  operations: number; // 0-4
  numberSize: number; // 0-4
  complexity: number; // 0-4
}

const writingQuestions: Omit<Question, 'question'>[] = [
    { options: ['Voiture', 'Voitrue', 'Vouature', 'Voiturre'], answer: 'Voiture', hint: 'orthographe véhicule' },
    { options: ['Maison', 'Maizon', 'Meison', 'Maisone'], answer: 'Maison', hint: 'orthographe bâtiment' },
    { options: ['Écolle', 'Aicole', 'École', 'Aicolle'], answer: 'École', hint: 'orthographe lieu d\'apprentissage' },
    { options: ['Garçon', 'Garcon', 'Garscon', 'Garçons'], answer: 'Garçon', hint: 'orthographe personne' },
    { options: ['Fille', 'Fiile', 'Fie', 'Fill'], answer: 'Fille', hint: 'orthographe personne' },
    { options: ['Livre', 'Lievre', 'Lyvre', 'Leavre'], answer: 'Livre', hint: 'orthographe objet' },
    { options: ['Table', 'Tabble', 'Tabel', 'Tabl'], answer: 'Table', hint: 'orthographe meuble' },
    { options: ['Chaise', 'Chaize', 'Chèze', 'Chaise '], answer: 'Chaise', hint: 'orthographe meuble' },
    { options: ['Ordinater', 'Ordinateur', 'Ordinatore', 'Ordinatur'], answer: 'Ordinateur', hint: 'orthographe appareil' },
    { options: ['Soleil', 'Solail', 'Soleille', 'Solleil'], answer: 'Soleil', hint: 'orthographe astre' },
];

function generateTimeQuestion(): Question {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 12) * 5;
    const answer = `${hour}:${minute.toString().padStart(2, '0')}`;

    const options = [answer];
    while (options.length < 4) {
        const wrongHour = Math.floor(Math.random() * 12) + 1;
        const wrongMinute = Math.floor(Math.random() * 12) * 5;
        const wrongOption = `${wrongHour}:${wrongMinute.toString().padStart(2, '0')}`;
        if (!options.includes(wrongOption)) {
            options.push(wrongOption);
        }
    }

    return {
        question: 'Quelle heure est-il sur l\'horloge ?',
        hour,
        minute,
        options: options.sort(() => Math.random() - 0.5),
        answer,
    };
}


const numberRanges = [10, 20, 100, 500, 1000];
const availableOps = ['+', '-', 'x', '÷'];

function generateCalculationQuestion(settings: CalculationSettings): Question {
    const { operations, numberSize, complexity } = settings;

    const maxNumber = numberRanges[numberSize];
    const ops = availableOps.slice(0, operations + 1);
    const selectedOp = ops[Math.floor(Math.random() * ops.length)];

    let num1: number, num2: number, question: string, answer: number;

    switch (selectedOp) {
        case '+':
            num1 = Math.floor(Math.random() * maxNumber);
            num2 = Math.floor(Math.random() * maxNumber);
            if (complexity === 1 && num1 + num2 > 10) { // No carry
                num2 = Math.floor(Math.random() * (10 - (num1 % 10)));
                num1 = Math.floor(num1 / 10) * 10 + (num1 % 10);
            }
            question = `${num1} + ${num2} = ?`;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * maxNumber);
            num2 = Math.floor(Math.random() * num1); // Ensure positive result
             if (complexity === 1 && (num1 % 10) < (num2 % 10)) { // No borrow
                num2 = Math.floor(Math.random() * (num1 % 10));
            }
            question = `${num1} - ${num2} = ?`;
            answer = num1 - num2;
            break;
        case 'x':
            // Simpler multiplication for lower levels
            const multMax = numberSize < 2 ? 10 : 20;
            num1 = Math.floor(Math.random() * multMax);
            num2 = Math.floor(Math.random() * multMax);
            question = `${num1} x ${num2} = ?`;
            answer = num1 * num2;
            break;
        case '÷':
            // Division without remainder
            const divMax = numberSize < 2 ? 10 : (numberSize < 4 ? 20 : 50);
            num2 = Math.floor(Math.random() * (divMax -1)) + 1;
            answer = Math.floor(Math.random() * divMax);
            num1 = num2 * answer;
            question = `${num1} ÷ ${num2} = ?`;
            break;
        default: // Fallback
            num1 = Math.floor(Math.random() * 10);
            num2 = Math.floor(Math.random() * 10);
            question = `${num1} + ${num2} = ?`;
            answer = num1 + num2;
    }

    const options = new Set<string>();
    options.add(answer.toString());

    while (options.size < 4) {
        const errorMargin = Math.ceil(answer * 0.2) + 5;
        const wrongAnswer = answer + Math.floor(Math.random() * errorMargin * 2) - errorMargin;
        if (wrongAnswer !== answer && wrongAnswer >= 0) {
            options.add(wrongAnswer.toString());
        }
    }

    return {
        question,
        answer: answer.toString(),
        options: Array.from(options).sort(() => Math.random() - 0.5),
    };
}


export function generateQuestions(skill: string, count: number, settings?: CalculationSettings): Question[] {
  if (skill === 'time') {
    return Array.from({ length: count }, generateTimeQuestion);
  }
  
  if (skill === 'writing') {
     return writingQuestions.slice(0, count).map(q => ({
        ...q,
        question: 'Quel mot est correctement orthographié ?'
     }));
  }

  if (skill === 'calculation' && settings) {
    // TODO: Implement cognitive complexity logic
    return Array.from({ length: count }, () => generateCalculationQuestion(settings));
  }

  // Fallback for other skills for now
  return Array.from({ length: count }, () => ({
    question: 'Ceci est un exemple de question. Choisissez la bonne réponse.',
    options: ['Bonne réponse', 'Mauvaise réponse', 'Autre mauvaise réponse', 'Encore une autre'],
    answer: 'Bonne réponse',
    hint: 'point d\'interrogation',
  }));
}
