
'use server';

import type { Question, NumberLevelSettings } from './questions';
import { numberToWords } from "./utils";

export async function generateLireLesNombresQuestion(settings: NumberLevelSettings): Promise<Question> {
    const isReverse = Math.random() > 0.5;
    let min, max: number;

    switch(settings.level) {
        case 'A': min = 1; max = 30; break;
        case 'B': min = 11; max = 1000; break;
        case 'C': min = 69; max = 100000; break;
        case 'D': min = 1001; max = 1000000; break;
        default: min = 0; max = 100;
    }
    
    let answerNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Logic for injecting zeros
    if (settings.level === 'C' && Math.random() > 0.7) {
        let s = String(answerNumber);
        if (s.length >= 3) {
            const zeroPos = Math.floor(Math.random() * (s.length - 2)) + 1; // Avoid first/last digit
            s = s.substring(0, zeroPos) + '0' + s.substring(zeroPos + 1);
            answerNumber = parseInt(s);
        }
    } else if (settings.level === 'D' && Math.random() > 0.2) { // 80% chance
        let s = String(answerNumber);
        const len = s.length;
        if (len > 4) {
            // Replace one or two non-zero, non-leading digits with '0'
            const zeroPos = Math.floor(Math.random() * (len - 2)) + 1;
            s = s.substring(0, zeroPos) + '0' + s.substring(zeroPos + 1);
             if (len > 4 && Math.random() > 0.5) {
                 let zeroPos2 = Math.floor(Math.random() * (len - 2)) + 1;
                 while(zeroPos2 === zeroPos) {
                    zeroPos2 = Math.floor(Math.random() * (len - 2)) + 1;
                 }
                 s = s.substring(0, zeroPos2) + '0' + s.substring(zeroPos2 + 1);
             }
            answerNumber = parseInt(s);
        }
    }


    const answerText = String(answerNumber);
    const answerAudio = numberToWords(answerNumber);
    
    if ((settings.level === 'C' || settings.level === 'D') && Math.random() > 0.5) {
        return {
            id: Date.now(),
            level: settings.level,
            type: 'audio-to-text-input',
            question: "Écris en chiffres le nombre que tu entends.",
            textToSpeak: answerAudio,
            answer: answerText,
            answerInWords: answerAudio,
            numberLevelSettings: settings
        };
    }

    const options = new Set<number>([answerNumber]);

    // Generate trap options
    while (options.size < 4) {
        let trapNumber: number;
        const magnitude = String(answerNumber).length;
        // Try to generate a similarly-sized number
        if (magnitude > 1) {
            const trapMin = Math.max(min, Math.pow(10, magnitude - 1));
            const trapMax = Math.min(max, Math.pow(10, magnitude) - 1);
            trapNumber = Math.floor(Math.random() * (trapMax - trapMin + 1)) + trapMin;
        } else {
             trapNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        }

        if (trapNumber !== answerNumber) {
            options.add(trapNumber);
        }
    }

    const allOptions = Array.from(options);

    if (isReverse) {
         return {
            id: Date.now(),
            level: settings.level,
            type: 'written-to-audio-qcm',
            question: "Comment se prononce ce nombre ?",
            answer: answerText,
            textToSpeak: answerText,
            optionsWithAudio: allOptions.sort(() => Math.random() - 0.5).map(num => ({
                text: String(num),
                audio: numberToWords(num)
            })),
            numberLevelSettings: settings
        };
    } else {
        return {
            id: Date.now(),
            level: settings.level,
            type: 'audio-qcm',
            question: "Clique sur le nombre que tu entends.",
            options: allOptions.map(String).sort(() => Math.random() - 0.5),
            answer: answerText,
            textToSpeak: answerAudio,
            numberLevelSettings: settings
        };
    }
}
