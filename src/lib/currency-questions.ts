

'use server';

import { currency, euroPiecesAndBillets, formatCurrency, allCoins } from './currency';
import type { Question, CurrencySettings } from './questions';

const getRandomAmount = (max: number, multipleOfFive: boolean = false): number => {
    let amount = Math.random() * max;
    if (multipleOfFive) {
        amount = Math.round(amount / 0.05) * 0.05;
    }
    return parseFloat(amount.toFixed(2));
}


const generateLevelA = (): Question => {
    const questionType = Math.random();

    // Type 1: Recognize a specific coin/bill (drag & drop)
    if (questionType < 0.5) {
        const availableMoney = [...euroPiecesAndBillets].sort(() => 0.5 - Math.random());
        const correctItem = availableMoney.shift()!; // Take the first one as correct
        const distractors = availableMoney.slice(0, 2); // Take the next two as distractors
        const items = [correctItem, ...distractors].sort(() => 0.5 - Math.random());

        return {
            id: Date.now(),
            level: 'A',
            type: 'drag-and-drop-recognition',
            question: `Mets la pièce de ${correctItem.name} dans la boîte.`,
            boxLabel: "Glisse la bonne pièce ou le bon billet ici",
            items: items.map(item => ({...item, id: item.name })),
            answer: correctItem.name,
            currencySettings: { difficulty: 0 }
        };
    } 
    // Type 2: Sort pieces vs bills
    else {
        const sortBy = Math.random() > 0.5 ? 'pièce' : 'billet';
        return {
            id: Date.now(),
            level: 'A',
            type: 'select-multiple',
            question: "Qu'est-ce qui va dans la boîte ?",
            boxLabel: sortBy === 'pièce' ? 'Pièces de monnaie' : 'Billets de banque',
            items: currency.map(item => ({...item, value: item.type === sortBy ? 1 : 0 })),
            correctValue: 1, // 1 for the correct type
            currencySettings: { difficulty: 0 }
        };
    }
}

export async function generateCurrencyQuestion(settings: CurrencySettings): Promise<Question> {
    const { difficulty } = settings;

    if (difficulty === 0) {
        return generateLevelA();
    }
    
    if (difficulty === 1) {
        const possibleTargets = [3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19];
        const targetAmount = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
         return {
            id: Date.now(),
            level: 'B',
            type: 'compose-sum',
            question: `Fais une somme de ${formatCurrency(targetAmount)}.`,
            targetAmount: targetAmount,
            currencySettings: settings,
        };
    }


    switch (difficulty) {
        case 2: { // Niveau C
            const numItems = Math.floor(Math.random() * 5) + 3; // 3 to 7 items
            const items = [];
            let totalValue = 0;
            for(let i=0; i < numItems; i++) {
                const item = allCoins[Math.floor(Math.random() * allCoins.length)];
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

        case 3: { // Niveau D
             const cost = getRandomAmount(40, true); // e.g., 12.35
             const paymentOptions = euroPiecesAndBillets.filter(c => c.value > cost && c.type === 'billet');
             const paymentBill = paymentOptions.length > 0
                ? paymentOptions[Math.floor(Math.random() * paymentOptions.length)]
                : { name: '50€', value: 50.00, image: '/images/monnaie/50euros.png', type: 'billet' }; // Fallback
             
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
             return generateCurrencyQuestion({ difficulty: 0 }); // Fallback
    }
}
