
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

export async function generateCurrencyQuestion(settings: CurrencySettings): Promise<Question> {
    const { difficulty } = settings;

    switch (difficulty) {
        // Niveau 1: Faire une somme exacte (pièces et billets simples)
        case 0: {
            const targetAmount = getRandomAmount(10, true);
            return {
                id: Date.now(),
                level: 'A',
                type: 'compose-sum',
                question: `Fais une somme de ${formatCurrency(targetAmount)}.`,
                targetAmount: targetAmount,
                currencySettings: settings,
            };
        }
        
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
             return generateCurrencyQuestion({ difficulty: 0 }); // Fallback
    }
}
