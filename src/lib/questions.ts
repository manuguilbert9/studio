
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
    { options: ['Garçon', 'Garcon', 'Garscon', 'Garsons'], answer: 'Garçon', hint: 'orthographe personne' },
    { options: ['Fille', 'Fiile', 'Fie', 'Fill'], answer: 'Fille', hint: 'orthographe personne' },
    { options: ['Livre', 'Lievre', 'Lyvre', 'Leavre'], answer: 'Livre', hint: 'orthographe objet' },
    { options: ['Table', 'Tabble', 'Tabel', 'Tabl'], answer: 'Table', hint: 'orthographe meuble' },
    { options: ['Chaise', 'Chaize', 'Chèze', 'Chaisse'], answer: 'Chaise', hint: 'orthographe meuble' },
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

    // Complexity Levels:
    // 0: Immediate (e.g., 2+3)
    // 1: Simple, no carry (e.g., 12+14)
    // 2: With carry/borrow (e.g., 27+38)
    // 3: Decomposition (e.g., 49x6) - Not yet implemented
    // 4: Multi-step (e.g., (38+47)-29) - Not yet implemented

    switch (selectedOp) {
        case '+':
            if (complexity === 0) { // Immediate
                num1 = Math.floor(Math.random() * 10);
                num2 = Math.floor(Math.random() * (10 - num1));
            } else if (complexity === 1) { // Simple, no carry
                num1 = Math.floor(Math.random() * maxNumber);
                const unit1 = num1 % 10;
                let maxUnit2 = 9 - unit1;
                let num2Unit = Math.floor(Math.random() * (maxUnit2 + 1));
                num2 = Math.floor(Math.random() * (maxNumber / 10)) * 10 + num2Unit;
                 if (num1 + num2 > maxNumber) {
                     num2 = Math.floor(num2 / 10) * 10 + num2Unit;
                 }
                 if(num2 > maxNumber) num2 = maxNumber - num1 -1;
                 if(num2 < 0) num2 = 0;
            } else { // With carry (level 2+)
                num1 = Math.floor(Math.random() * maxNumber);
                num2 = Math.floor(Math.random() * maxNumber);
            }
            question = `${num1} + ${num2} = ?`;
            answer = num1 + num2;
            break;

        case '-':
            if (complexity === 0) { // Immediate
                num1 = Math.floor(Math.random() * 10);
                num2 = Math.floor(Math.random() * (num1 + 1));
            } else if (complexity === 1) { // Simple, no borrow
                num1 = Math.floor(Math.random() * maxNumber);
                const unit1 = num1 % 10;
                let num2Unit = Math.floor(Math.random() * (unit1 + 1));
                num2 = Math.floor(Math.random() * (num1 / 10)) * 10 + num2Unit;
                if(num2 > num1) num2 = Math.floor(num1 / 10) * 10 + num2Unit;
                if(num2 < 0) num2 = 0;
            } else { // With borrow (level 2+)
                num1 = Math.floor(Math.random() * maxNumber);
                num2 = Math.floor(Math.random() * num1); 
            }
            question = `${num1} - ${num2} = ?`;
            answer = num1 - num2;
            break;

        case 'x':
            const multMax = numberSize < 2 ? 10 : (complexity < 2 ? 10 : 20);
            num1 = Math.floor(Math.random() * multMax);
            num2 = Math.floor(Math.random() * (complexity < 1 ? (num1 > 5 ? 1 : 2) : multMax)); // Simpler for level 0
            question = `${num1} x ${num2} = ?`;
            answer = num1 * num2;
            break;

        case '÷':
            const divMax = numberSize < 2 ? 10 : (numberSize < 4 ? 20 : 50);
            num2 = Math.floor(Math.random() * (divMax - 1)) + 1;
            answer = Math.floor(Math.random() * (complexity < 2 ? 5 : divMax));
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
        const errorMargin = Math.max(1, Math.ceil(answer * 0.2) + 5);
        let wrongAnswer = answer + (Math.floor(Math.random() * errorMargin) + 1) * (Math.random() < 0.5 ? -1 : 1);
        
        // Ensure options are somewhat close but not identical
        if(Math.abs(wrongAnswer - answer) < 2 && answer > 5) {
             wrongAnswer = answer + (Math.random() < 0.5 ? -2 : 2)
        }

        if (wrongAnswer !== answer && wrongAnswer >= 0) {
            options.add(Math.round(wrongAnswer).toString());
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
    // Levels 3 and 4 are not fully implemented, they will behave like level 2 for now.
    const effectiveSettings = {...settings};
    if (settings.complexity > 2) {
      effectiveSettings.complexity = 2; 
    }
    return Array.from({ length: count }, () => generateCalculationQuestion(effectiveSettings));
  }

  // Fallback for other skills for now
  return Array.from({ length: count }, () => ({
    question: 'Ceci est un exemple de question. Choisissez la bonne réponse.',
    options: ['Bonne réponse', 'Mauvaise réponse', 'Autre mauvaise réponse', 'Encore une autre'],
    answer: 'Bonne réponse',
    hint: 'point d\'interrogation',
  }));
}
