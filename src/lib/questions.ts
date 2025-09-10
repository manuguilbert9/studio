

'use server';

import { numberToFrench, numberToWords } from "./utils";
import type { SkillLevel } from './skills';
import { generateCalendarQuestions, type CalendarQuestion } from './calendar-questions';
import { generateMentalMathQuestions, type MentalMathQuestion } from './mental-math';
import { generateTimeQuestion } from "./time-questions";
import { generateSyllabeAttaqueQuestion } from "./syllabe-questions";
import { generateDénombrementQuestion } from "./count-questions";
import { generateKeyboardCountQuestion } from "./keyboard-count-questions";
import { generateLettresEtSonsQuestion } from "./letter-sound-questions";
import { generateEcouteLesNombresQuestion } from './number-listening-questions';
import { generateNombresComplexesQuestion } from './complex-number-questions';


export interface Question extends CalendarQuestion, MentalMathQuestion {
  type: 'qcm' | 'set-time' | 'count' | 'audio-qcm' | 'written-to-audio-qcm' | 'audio-to-text-input' | 'keyboard-count' | 'letter-sound-qcm' | 'image-qcm' | 'click-date' | 'count-days';
  question: string;
  // For QCM
  options?: string[];
  answer?: string;
  images?: { src: string; alt: string; hint?: string }[];
  image?: string | null;
  hint?: string;
  // For time questions (QCM and set-time)
  hour?: number;
  minute?: number;
  timeSettings?: TimeSettings;
  // For count questions
  countEmoji?: string;
  countNumber?: number;
  // For audio questions
  textToSpeak?: string;
  // For written-to-audio questions
  optionsWithAudio?: { text: string; audio: string }[];
  // For audio-to-text-input questions
  answerInWords?: string;
  // For letter-sound questions
  letter?: string;
  // For syllable-attack questions
  syllable?: string;
  // For calendar
  description?: string;
  answerDate?: string;
  month?: string;
  answerNumber?: number;
  // For mental math
  visuals?: { emoji: string; count: number }[];
}

export interface CalculationSettings {
  operations: number; // 0-4
  numberSize: number; // 0-4
  complexity: number; // 0-2
}

export interface CurrencySettings {
  difficulty: number; // 0-3
}

export interface TimeSettings {
  difficulty: number; // 0-3
  showMinuteCircle: boolean;
  matchColors: boolean;
  coloredHands: boolean;
}

export interface CountSettings {
    maxNumber: number;
}

export interface NumberLevelSettings {
    level: SkillLevel;
}

export interface CalendarSettings {
    level: SkillLevel;
}

export interface ReadingRaceSettings {
  level: 'Niveau A' | 'Niveau B' | 'Niveau C' | 'Niveau D';
}

export interface AllSettings {
  time?: TimeSettings;
  count?: CountSettings;
  numberLevel?: NumberLevelSettings;
  calendar?: CalendarSettings;
  readingRace?: ReadingRaceSettings;
}

function generateLireLesNombresQuestion(settings: NumberLevelSettings): Question {
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


export async function generateQuestions(
  skill: string,
  count: number,
  settings?: AllSettings
): Promise<Question[]> {
  const promises: Promise<Question>[] = [];
  
  if (skill === 'time' && settings?.time) {
    for (let i = 0; i < count; i++) {
        promises.push(generateTimeQuestion(settings.time!));
    }
    return Promise.all(promises);
  }
  
  if (skill === 'denombrement' && settings?.count) {
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
          questions.push(await generateDénombrementQuestion(settings.count!));
      }
      return questions;
  }

  if (skill === 'keyboard-count') {
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
          questions.push(await generateKeyboardCountQuestion());
      }
      return questions;
  }

  if (skill === 'ecoute-les-nombres') {
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
        questions.push(await generateEcouteLesNombresQuestion());
      }
      return questions;
  }

  if (skill === 'nombres-complexes') {
      const questions: Question[] = [];
       for (let i = 0; i < count; i++) {
        questions.push(await generateNombresComplexesQuestion());
      }
      return questions;
  }
  
  if (skill === 'lire-les-nombres' && settings?.numberLevel) {
      return Array.from({ length: count }, () => generateLireLesNombresQuestion(settings.numberLevel!));
  }
  
  if (skill === 'lettres-et-sons') {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
        questions.push(await generateLettresEtSonsQuestion());
    }
    return questions;
  }
  
  if (skill === 'syllabe-attaque') {
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
          questions.push(await generateSyllabeAttaqueQuestion());
      }
      return questions;
  }

  if (skill === 'calendar' && settings?.calendar) {
      return await generateCalendarQuestions(settings.calendar.level, count);
  }
  
  if (skill === 'mental-calculation' && settings?.numberLevel) {
      return generateMentalMathQuestions(settings.numberLevel.level, count);
  }


  // Fallback
  return Array.from({ length: count }, () => ({
    id: Date.now(),
    level: 'A',
    type: 'qcm',
    question:
      'Ceci est un exemple de question. Choisissez la bonne réponse.',
    options: [
      'Bonne réponse',
      'Mauvaise réponse',
      'Autre mauvaise réponse',
      'Encore une autre',
    ],
    answer: 'Bonne réponse',
    hint: "point d'interrogation",
  }));
}
