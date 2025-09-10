
'use server';

import type { Question } from './questions';
import { numberToFrench } from './utils';

// Generates questions for the "nombres-complexes" skill (60-99)
export async function generateNombresComplexesQuestion(): Promise<Question> {
    const questionType = Math.random();
    const answerNumber = Math.floor(Math.random() * 40) + 60; // 60 to 99
    const answerText = String(answerNumber);
    const answerAudio = numberToFrench[answerNumber] || answerText;

    // 1. Dictée de nombres
    if (questionType < 0.25) {
        return {
            id: Date.now(),
            level: 'B',
            type: 'audio-to-text-input',
            question: "Écris en chiffres le nombre que tu entends.",
            textToSpeak: answerAudio,
            answer: answerText,
            answerInWords: answerAudio
        };
    }
    // 2. Écrit vers oral
    else if (questionType < 0.5) {
        const options = new Set<number>([answerNumber]);
        const tens = Math.floor(answerNumber / 10) * 10;
        
        // Piège de dizaine (82 vs 92)
        if (tens === 80) options.add(90 + (answerNumber % 10));
        else if (tens === 90) options.add(80 + (answerNumber % 10));
        else if (tens === 70) options.add(90 + (answerNumber % 10));

        // Piège de voisin
        if (answerNumber > 60) options.add(answerNumber - 1);
        if (answerNumber < 99) options.add(answerNumber + 1);

        // Piège de structure morphologique (72 vs 92, 72 vs 62)
        if (answerNumber % 10 === 2) {
             if (tens === 70) options.add(92);
             if (tens === 90) options.add(72);
             options.add(62);
        }

        while (options.size < 4) {
            options.add(Math.floor(Math.random() * 40) + 60);
        }

        return {
            id: Date.now(),
            level: 'B',
            type: 'written-to-audio-qcm',
            question: "Comment se prononce ce nombre ?",
            answer: answerText,
            textToSpeak: answerText,
            optionsWithAudio: Array.from(options).sort(() => Math.random() - 0.5).map(num => ({
                text: String(num),
                audio: numberToFrench[num] || String(num)
            }))
        };
    }
    // 3. Oral vers écrit
    else {
        const options = new Set<number>([answerNumber]);
        const tens = Math.floor(answerNumber / 10) * 10;

        // Piège voisin (n-1 ou n+1)
        const neighbor = Math.random() > 0.5 ? answerNumber + 1 : answerNumber - 1;
        if (neighbor >= 60 && neighbor <= 99) options.add(neighbor);

        // Piège de dizaine
        if (tens === 60) options.add(70 + (answerNumber % 10));
        if (tens === 70) options.add(90 + (answerNumber % 10));
        if (tens === 80) options.add(90 + (answerNumber % 10));
        if (tens === 90) options.add(70 + (answerNumber % 10));
        
        // Piège de structure (65 vs 75)
        if (tens === 60 && answerNumber % 10 > 0) options.add(70 + (answerNumber % 10));

        // Piège d'inversion (67 vs 76)
        const ones = answerNumber % 10;
        if (ones > 0) {
            const invertedTens = ones * 10;
            const invertedOnes = Math.floor(tens / 10);
            const inverted = invertedTens + invertedOnes;
            if (inverted >= 60 && inverted <= 99) {
                options.add(inverted);
            }
        }

        while (options.size < 4) {
            options.add(Math.floor(Math.random() * 40) + 60);
        }

        return {
            id: Date.now(),
            level: 'B',
            type: 'audio-qcm',
            question: "Clique sur le nombre que tu entends.",
            options: Array.from(options).map(String).sort(() => Math.random() - 0.5),
            answer: answerText,
            textToSpeak: answerAudio,
        };
    }
}
