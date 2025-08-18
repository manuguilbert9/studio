



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

export interface CurrencySettings {
    difficulty: number; // 0-3
}

export interface AllSettings {
    calculation?: CalculationSettings;
    currency?: CurrencySettings;
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
  { name: '1 cent', value: 1, image: '/1cent.png', hint: 'pièce 1 centime' },
  { name: '2 cents', value: 2, image: '/2cents.png', hint: 'pièce 2 centimes' },
  { name: '5 cents', value: 5, image: '/5cents.png', hint: 'pièce 5 centimes' },
  { name: '10 cents', value: 10, image: '/10cents.png', hint: 'pièce 10 centimes' },
  { name: '20 cents', value: 20, image: '/20cents.png', hint: 'pièce 20 centimes' },
  { name: '50 cents', value: 50, image: '/50cents.png', hint: 'pièce 50 centimes' },
  { name: '1 euro', value: 100, image: '/1euro.png', hint: 'pièce 1 euro' },
  { name: '2 euros', value: 200, image: '/2euros.png', hint: 'pièce 2 euros' },
  { name: '5 euros', value: 500, image: '/5euros.png', hint: 'billet 5 euros' },
  { name: '10 euros', value: 1000, image: '/10euros.png', hint: 'billet 10 euros' },
  { name: '20 euros', value: 2000, image: '/20euros.png', hint: 'billet 20 euros' },
  { name: '50 euros', value: 5000, image: '/50euros.png', hint: 'billet 50 euros' },
  { name: '100 euros', value: 10000, image: '/100euros.png', hint: 'billet 100 euros' },
];

const formatCurrency = (value: number) => {
    const euros = Math.floor(value / 100);
    const cents = value % 100;
    if (euros > 0 && cents === 0) return `${euros} €`;
    if (euros === 0 && cents > 0) return `${cents}c`;
    if (euros > 0 && cents > 0) return `${euros},${cents.toString().padStart(2, '0')} €`;
    return '0 €';
}

function generateCurrencyQuestion(settings: CurrencySettings): Question {
    const { difficulty } = settings;
    let question: string = '';
    let answer: string = '';
    let options: Set<string> = new Set();
    let images: { src: string; alt: string; hint?: string }[] = [];
    let image: string | null = null;
    
    switch (difficulty) {
        case 0: { // Reconnaissance
            const item = currency[Math.floor(Math.random() * currency.length)];
            question = 'Quelle est la valeur de cette pièce/ce billet ?';
            answer = formatCurrency(item.value);
            options = new Set([answer]);
            image = item.image;
            images = [];
             while (options.size < 4) {
                const randomItem = currency[Math.floor(Math.random() * currency.length)];
                if(randomItem.value !== item.value) {
                    options.add(formatCurrency(randomItem.value));
                }
            }
            break;
        }

        case 1: { // Comptage simple
             const numItems = Math.floor(Math.random() * 3) + 2; // 2 to 4 items
             let selectedItems = [];
             let totalValue = 0;
             const availableSimpleCurrency = currency.filter(c => [100, 200, 500, 1000].includes(c.value)); // 1€, 2€, 5€, 10€

             for (let i = 0; i < numItems; i++) {
                 const item = availableSimpleCurrency[Math.floor(Math.random() * availableSimpleCurrency.length)];
                 selectedItems.push(item);
                 totalValue += item.value;
             }

             question = 'Quelle est la somme totale ?';
             answer = formatCurrency(totalValue);
             options = new Set([answer]);
             images = selectedItems.map(item => ({ src: item.image, alt: item.name, hint: item.hint }));
             while (options.size < 4) {
                 const errorAmount = (Math.floor(Math.random() * 5) + 1) * 100; // +/- 1, 2...5 euros
                 const wrongValue = totalValue + (Math.random() > 0.5 ? errorAmount : -errorAmount);
                 if (wrongValue > 0) {
                     options.add(formatCurrency(wrongValue));
                 }
             }
            break;
        }
        
        case 2: { // Composition / Décomposition / Soustraction
            const questionType = Math.random() > 0.5 ? 'addition' : 'subtraction';

            if (questionType === 'subtraction') {
                const simpleBills = currency.filter(c => c.value >= 500 && c.value <= 2000); // 5, 10, 20
                const startAmountItem = simpleBills[Math.floor(Math.random() * simpleBills.length)];
                const startAmount = startAmountItem.value;

                // Cost is a round number of euros, less than startAmount
                const cost = (Math.floor(Math.random() * (startAmount / 100 - 2)) + 1) * 100; 
                
                const remaining = startAmount - cost;
                
                question = `Je paie avec ${formatCurrency(startAmount)} un article qui coûte ${formatCurrency(cost)}. Combien me reste-t-il ?`;
                answer = formatCurrency(remaining);
                options = new Set([answer]);
                image = startAmountItem.image;

                while (options.size < 4) {
                    const error = (Math.floor(Math.random() * 4) + 1) * 100; // +/- 1, 2, 3, 4 euros
                    let wrongAnswer = remaining + (Math.random() > 0.5 ? error : -error);
                    if(wrongAnswer > 0 && wrongAnswer !== remaining) {
                        options.add(formatCurrency(wrongAnswer));
                    }
                }
            } else { // Addition (more complex than level 2)
                 const numItems = Math.floor(Math.random() * 4) + 3; // 3 to 6 items
                 let selectedItems = [];
                 let totalValue = 0;
                 // Use a wider range of currency, including cents
                 const availableCurrency = currency.filter(c => c.value <= 5000); // Up to 50€

                 for (let i = 0; i < numItems; i++) {
                     const item = availableCurrency[Math.floor(Math.random() * availableCurrency.length)];
                     selectedItems.push(item);
                     totalValue += item.value;
                 }

                 question = 'Quelle est la somme totale ?';
                 answer = formatCurrency(totalValue);
                 options = new Set([answer]);
                 images = selectedItems.map(item => ({ src: item.image, alt: item.name, hint: item.hint }));
                 while (options.size < 4) {
                     const errorAmount = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.3 ? 100 : 10); // Error in euros or tens of cents
                     const wrongValue = totalValue + (Math.random() > 0.5 ? errorAmount : -errorAmount);
                     if (wrongValue > 0 && wrongValue !== totalValue) {
                         options.add(formatCurrency(wrongValue));
                     }
                 }
            }
            break;
        }
        
        default: { // Fallback, default to level 1 logic
             const item = currency[Math.floor(Math.random() * currency.length)];
             question = 'Quelle est la valeur de cette pièce/ce billet ?';
             answer = formatCurrency(item.value);
             options = new Set([answer]);
             image = item.image;
             images = [];
              while (options.size < 4) {
                 const randomItem = currency[Math.floor(Math.random() * currency.length)];
                 if(randomItem.value !== item.value) {
                     options.add(formatCurrency(randomItem.value));
                 }
             }
            break;
        }
    }

    return {
        question,
        image,
        images,
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
                num2 = Math.floor(Math.random() * (maxNumber - num1));
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


export function generateQuestions(skill: string, count: number, settings?: AllSettings): Question[] {
  if (skill === 'time') {
    return Array.from({ length: count }, generateTimeQuestion);
  }
  
  if (skill === 'writing') {
     return writingQuestions.slice(0, count).map(q => ({
        ...q,
        question: 'Quel mot est correctement orthographié ?'
     }));
  }
  
  if (skill === 'currency' && settings?.currency) {
    return Array.from({ length: count }, () => generateCurrencyQuestion(settings.currency!));
  }

  if (skill === 'calculation' && settings?.calculation) {
    return Array.from({ length: count }, () => generateCalculationQuestion(settings.calculation!));
  }

  // Fallback for other skills for now
  return Array.from({ length: count }, () => ({
    question: 'Ceci est un exemple de question. Choisissez la bonne réponse.',
    options: ['Bonne réponse', 'Mauvaise réponse', 'Autre mauvaise réponse', 'Encore une autre'],
    answer: 'Bonne réponse',
    hint: 'point d\'interrogation',
  }));
}
