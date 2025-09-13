

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


const generateRecognitionDragAndDrop = (): Question => {
    const correctItem = euroPiecesAndBillets[Math.floor(Math.random() * euroPiecesAndBillets.length)];
    
    const distractors = new Set<typeof correctItem>();
    while(distractors.size < 2) {
        const randomItem = euroPiecesAndBillets[Math.floor(Math.random() * euroPiecesAndBillets.length)];
        if(randomItem.value !== correctItem.value) {
            distractors.add(randomItem);
        }
    }
    
    const items = [correctItem, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

    return {
        id: Date.now(),
        level: 'A',
        type: 'drag-and-drop-recognition',
        question: `Mets ${correctItem.type === 'pièce' ? 'la pièce de' : 'le billet de'} ${correctItem.name} dans la boîte.`,
        answer: correctItem.name,
        items: items.map(item => ({ id: item.name, name: item.name, image: item.image, value: item.value })),
        currencySettings: { difficulty: 0 },
    };
}

const generateLevelBQuestion = (): Question => {
    const questionType = Math.floor(Math.random() * 5);
    const scope = currency.filter(c => c.value <= 10); // 1c to 10€

    switch(questionType) {
        // 1. Identifier la valeur
        case 0: {
            const correctItem = scope[Math.floor(Math.random() * scope.length)];
            const options = new Set<string>([correctItem.name]);
            while(options.size < 3) {
                const randomItem = scope[Math.floor(Math.random() * scope.length)];
                if(randomItem.value !== correctItem.value) {
                    options.add(randomItem.name);
                }
            }
            return {
                id: Date.now(),
                level: 'B',
                type: 'qcm',
                question: 'Quelle est la valeur de cette pièce ou de ce billet ?',
                image: correctItem.image,
                hint: correctItem.name,
                options: Array.from(options).sort(),
                answer: correctItem.name,
                currencySettings: { difficulty: 1 },
            };
        }
        // 2. Addition simple
        case 1: {
            const item1 = allCoins[Math.floor(Math.random() * allCoins.length)];
            const item2 = allCoins[Math.floor(Math.random() * allCoins.length)];
            const sum = parseFloat((item1.value + item2.value).toFixed(2));
            if (sum > 5) return generateLevelBQuestion(); // Recalculate if sum is too high
            
            const options = new Set<string>([formatCurrency(sum)]);
             while(options.size < 4) {
                 const distractorOffset = (Math.random() - 0.5) * 2; // +/- 1 EUR
                 const distractorValue = Math.max(0, sum + distractorOffset);
                 options.add(formatCurrency(parseFloat(distractorValue.toFixed(2))));
            }
            return {
                id: Date.now(),
                level: 'B',
                type: 'qcm',
                question: `Quelle est la somme de ces deux pièces ?`,
                images: [{src: item1.image, alt: item1.name}, {src: item2.image, alt: item2.name}],
                options: Array.from(options).sort(),
                answer: formatCurrency(sum),
                currencySettings: { difficulty: 1 },
            };
        }
        // 3. Comparer deux valeurs
        case 2: {
            const scope = currency.filter(c => c.value <= 5);
            const item1 = scope[Math.floor(Math.random() * scope.length)];
            let item2 = scope[Math.floor(Math.random() * scope.length)];
            while(item1.value === item2.value) {
                 item2 = scope[Math.floor(Math.random() * scope.length)];
            }
            const correctAnswer = item1.value > item2.value ? item1.name : item2.name;
            return {
                id: Date.now(),
                level: 'B',
                type: 'image-qcm',
                question: 'Quelle est la pièce ou le billet qui a le plus de valeur ?',
                images: [{src: item1.image, alt: item1.name}, {src: item2.image, alt: item2.name}],
                answer: correctAnswer,
                currencySettings: { difficulty: 1 },
            }
        }
        // 4. Équivalence
        case 3: {
            const coin = allCoins[Math.floor(Math.random() * 5)]; // 1c, 2c, 5c, 10c, 20c
            const multiplier = [2, 3, 4, 5][Math.floor(Math.random()*4)];
            const total = coin.value * multiplier;
            if (total > 2) return generateLevelBQuestion();
            
            const correctEquivalent = allCoins.find(c => c.value === total);
            if (!correctEquivalent) return generateLevelBQuestion(); // No single coin equivalent

            const distractors = new Set<string>();
            while(distractors.size < 2) {
                const randomCoin = allCoins[Math.floor(Math.random() * allCoins.length)];
                if (randomCoin.value !== total) {
                    distractors.add(randomCoin.name);
                }
            }
            return {
                id: Date.now(),
                level: 'B',
                type: 'image-qcm',
                question: `Clique sur la pièce qui a la même valeur que ${multiplier} × ${coin.name}.`,
                images: [
                    {src: correctEquivalent.image, alt: correctEquivalent.name},
                    ...Array.from(distractors).map(name => {
                        const dCoin = allCoins.find(c => c.name === name)!;
                        return {src: dCoin.image, alt: dCoin.name};
                    })
                ].sort(() => Math.random() - 0.5),
                answer: correctEquivalent.name,
                currencySettings: { difficulty: 1 },
            }
        }
        // 5. Associer un prix
        case 4:
        default: {
            const scope = allCoins.filter(c => c.value <= 2);
            const correctCoin = scope[Math.floor(Math.random() * scope.length)];
            
            const distractors = new Set<string>();
            while(distractors.size < 2) {
                const randomCoin = scope[Math.floor(Math.random() * scope.length)];
                if (randomCoin.value !== correctCoin.value) {
                    distractors.add(randomCoin.name);
                }
            }
            return {
                id: Date.now(),
                level: 'B',
                type: 'image-qcm',
                question: `Quel objet correspond à ce prix : ${formatCurrency(correctCoin.value)} ?`,
                images: [
                     {src: correctCoin.image, alt: correctCoin.name},
                    ...Array.from(distractors).map(name => {
                        const dCoin = scope.find(c => c.name === name)!;
                        return {src: dCoin.image, alt: dCoin.name};
                    })
                ].sort(() => Math.random() - 0.5),
                answer: correctCoin.name,
                currencySettings: { difficulty: 1 },
            }
        }
    }
}


export async function generateCurrencyQuestion(settings: CurrencySettings): Promise<Question> {
    const { difficulty } = settings;

    // --- LEVEL A ---
    if (difficulty === 0) {
        return generateRecognitionDragAndDrop();
    }
    // --- LEVEL B ---
    if (difficulty === 1) {
        return generateLevelBQuestion();
    }

    // --- OTHER LEVELS ---
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
            const numItems = Math.floor(Math.random() * 5) + 3; // 3 to 7 items
            const items = [];
            let totalValue = 0;
            for(let i=0; i < numItems; i++) {
                // Use all coins for this level
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

        // Niveau 4: Rendre la monnaie
        case 3: {
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
