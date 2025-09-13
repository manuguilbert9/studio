

'use server';

import { currency, formatCurrency } from './currency';
import type { Question, CurrencySettings } from './questions';

const getRandomAmount = (max: number, multipleOfFive: boolean = false): number => {
    let amount = Math.random() * max;
    if (multipleOfFive) {
        amount = Math.round(amount / 0.05) * 0.05;
    }
    return parseFloat(amount.toFixed(2));
}

// --- LEVEL A: RECOGNITION ---

// Question type 1 & 2: Show me the X coin/bill.
const generateRecognitionQCM = (itemType: 'pièce' | 'billet'): Question => {
    const items = currency.filter(c => c.type === itemType);
    const correctItem = items[Math.floor(Math.random() * items.length)];
    
    const distractors = new Set<typeof correctItem>();
    while(distractors.size < 2) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        if(randomItem.value !== correctItem.value) {
            distractors.add(randomItem);
        }
    }
    
    const options = [correctItem, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

    return {
        id: Date.now(),
        level: 'A',
        type: 'image-qcm',
        question: `Montre-moi ${itemType === 'pièce' ? 'la pièce de' : 'le billet de'} ${correctItem.name}.`,
        answer: correctItem.name,
        images: options.map(item => ({ src: item.image, alt: item.name })),
        currencySettings: { difficulty: 0 },
    };
}

// Question type 3: Associate label with coin
const generateLabelQCM = (): Question => {
    const coins = currency.filter(c => c.type === 'pièce');
    const correctCoin = coins[Math.floor(Math.random() * coins.length)];
    
    const distractors = new Set<typeof correctCoin>();
    while(distractors.size < 2) {
        const randomCoin = coins[Math.floor(Math.random() * coins.length)];
        if(randomCoin.value !== correctCoin.value) {
            distractors.add(randomCoin);
        }
    }
    
    const options = [correctCoin, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

    return {
        id: Date.now(),
        level: 'A',
        type: 'image-qcm',
        question: `Où est la pièce de ${correctCoin.name} ?`,
        answer: correctCoin.name,
        images: options.map(item => ({ src: item.image, alt: item.name })),
        currencySettings: { difficulty: 0 },
    };
}

// Question type 4 & 5: Sort coins/bills
const generateSortingQuestion = (sortType: 'euros-vs-cents' | 'coins-vs-bills'): Question => {
    const itemsToShow = currency.sort(() => Math.random() - 0.5).slice(0, 7);
    
    let question = '';
    let correctValue = 0; // The 'value' we will check against

    if (sortType === 'euros-vs-cents') {
        question = "Trie les pièces : mets les EUROS dans la boîte.";
        correctValue = 1; // Represents items >= 1 euro
    } else { // coins-vs-bills
        question = "Sépare les pièces et les billets : mets les BILLETS dans la boîte.";
        correctValue = 2; // Represents items of type 'billet'
    }

    return {
        id: Date.now(),
        level: 'A',
        type: 'select-multiple',
        question: question,
        items: itemsToShow.map(item => ({
            name: item.name,
            image: item.image,
            // We'll use the 'value' field to encode the correct category
            value: (sortType === 'euros-vs-cents') 
                ? (item.value >= 1 ? 1 : 0) // 1 for euros, 0 for cents
                : (item.type === 'billet' ? 2 : 3) // 2 for billets, 3 for coins
        })),
        correctValue: correctValue, // This is what we check against
        currencySettings: { difficulty: 0 },
    }
}


export async function generateCurrencyQuestion(settings: CurrencySettings): Promise<Question> {
    const { difficulty } = settings;

    // --- LEVEL A ---
    if (difficulty === 0) {
        const questionType = Math.random();
        if (questionType < 0.25) return generateRecognitionQCM('pièce');
        if (questionType < 0.5) return generateRecognitionQCM('billet');
        if (questionType < 0.75) return generateSortingQuestion('coins-vs-bills');
        return generateSortingQuestion('euros-vs-cents');
    }

    // --- OTHER LEVELS (to be implemented) ---
    switch (difficulty) {
        // Niveau 2: Faire une somme exacte (toutes pièces et billets)
        case 1: {
            const targetAmount = getRandomAmount(50, true);
             return {
                id: Date.now(),
                level: 'B',
                type: 'compose-sum',
                question: `Fais une somme de ${formatCurrency(targetAmount)}.`,
                targetAmount: targetAmount,
                currencySettings: settings,
            };
        }

        // Niveau 3: Calculer une somme à partir d'images
        case 2: {
            const numItems = Math.floor(Math.random() * 4) + 3; // 3 to 6 items
            const items = [];
            let totalValue = 0;
            for(let i=0; i < numItems; i++) {
                const item = currency[Math.floor(Math.random() * currency.length)];
                items.push(item);
                totalValue += item.value;
            }
            totalValue = parseFloat(totalValue.toFixed(2));

            const options = new Set<string>();
            options.add(formatCurrency(totalValue));
            // Add distractors
            while (options.size < 4) {
                 const distractorOffset = (Math.random() - 0.5) * 5; // +/- 2.5 EUR
                 const distractorValue = Math.max(0, totalValue + distractorOffset);
                 options.add(formatCurrency(parseFloat(distractorValue.toFixed(2))));
            }
            
            return {
                id: Date.now(),
                level: 'C',
                type: 'qcm',
                question: `Quelle somme d'argent est représentée ci-dessous ?`,
                images: items.map(item => ({src: item.image, alt: item.name})),
                options: Array.from(options).sort(),
                answer: formatCurrency(totalValue),
                currencySettings: settings,
            }
        }

        // Niveau 4: Rendre la monnaie
        case 3: {
             const cost = getRandomAmount(40, true); // e.g., 12.35
             const paymentOptions = currency.filter(c => c.value > cost && c.value % 5 === 0); // 5, 10, 20, 50
             const paymentBill = paymentOptions[Math.floor(Math.random() * paymentOptions.length)];
             const change = parseFloat((paymentBill.value - cost).toFixed(2));
            
            return {
                id: Date.now(),
                level: 'D',
                type: 'compose-sum',
                question: `Rends la monnaie.`,
                targetAmount: change,
                cost: cost,
                paymentImages: [{ name: paymentBill.name, image: paymentBill.image }],
                currencySettings: settings,
            };
        }

        default:
             return generateCurrencyQuestion({ difficulty: 1 }); // Fallback
    }
}
