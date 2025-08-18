

export interface Question {
  question: string;
  options: string[];
  answer: string;
  images?: { src: string; alt: string, hint?: string }[];
  image?: string | null;
  hint?: string;
  hour?: number;
  minute?: number;
}

export interface CalculationSettings {
  operations: number; // 0-4
  numberSize: number; // 0-4
  complexity: number; // 0-2
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

const currency = [
  { name: '1 cent', value: 1, image: 'https://placehold.co/100x100.png', hint: 'pièce 1 centime' },
  { name: '2 cents', value: 2, image: 'https://placehold.co/100x100.png', hint: 'pièce 2 centimes' },
  { name: '5 cents', value: 5, image: 'https://placehold.co/100x100.png', hint: 'pièce 5 centimes' },
  { name: '10 cents', value: 10, image: 'https://placehold.co/100x100.png', hint: 'pièce 10 centimes' },
  { name: '20 cents', value: 20, image: 'https://placehold.co/100x100.png', hint: 'pièce 20 centimes' },
  { name: '50 cents', value: 50, image: 'https://placehold.co/100x100.png', hint: 'pièce 50 centimes' },
  { name: '1 euro', value: 100, image: 'https://placehold.co/100x100.png', hint: 'pièce 1 euro' },
  { name: '2 euros', value: 200, image: 'https://placehold.co/100x100.png', hint: 'pièce 2 euros' },
  { name: '5 euros', value: 500, image: 'https://placehold.co/150x80.png', hint: 'billet 5 euros' },
  { name: '10 euros', value: 1000, image: 'https://placehold.co/150x80.png', hint: 'billet 10 euros' },
  { name: '20 euros', value: 2000, image: 'https://placehold.co/150x80.png', hint: 'billet 20 euros' },
  { name: '50 euros', value: 5000, image: 'https://placehold.co/150x80.png', hint: 'billet 50 euros' },
  { name: '100 euros', value: 10000, image: 'https://placehold.co/150x80.png', hint: 'billet 100 euros' },
];

function generateCurrencyQuestion(): Question {
    const numItems = Math.floor(Math.random() * 4) + 2; // 2 to 5 items
    let selectedItems = [];
    let totalValue = 0;

    for (let i = 0; i < numItems; i++) {
        const item = currency[Math.floor(Math.random() * currency.length)];
        selectedItems.push(item);
        totalValue += item.value;
    }
    
    const formatCurrency = (value: number) => {
        const euros = Math.floor(value / 100);
        const cents = value % 100;
        if (cents === 0) return `${euros} €`;
        return `${euros},${cents.toString().padStart(2, '0')} €`;
    }

    const answer = formatCurrency(totalValue);
    const options = new Set<string>([answer]);

    while (options.size < 4) {
        const errorAmount = (Math.floor(Math.random() * 10) + 1) * 10; // +/- 10, 20...100 cents
        const wrongValue = totalValue + (Math.random() > 0.5 ? errorAmount : -errorAmount);
        if (wrongValue > 0) {
            options.add(formatCurrency(wrongValue));
        }
    }
    
    return {
        question: 'Quelle est la somme totale ?',
        images: selectedItems.map(item => ({ src: item.image, alt: item.name, hint: item.hint })),
        options: Array.from(options).sort(() => Math.random() - 0.5),
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
  
  if (skill === 'currency') {
    return Array.from({ length: count }, generateCurrencyQuestion);
  }

  if (skill === 'calculation' && settings) {
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
