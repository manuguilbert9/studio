

'use server';

import type { SkillLevel } from './skills';
import { generateCalendarQuestions, type CalendarQuestion } from './calendar-questions';
import { generateMentalMathQuestions, type MentalMathQuestion } from './mental-math';
import { generateTimeQuestion } from "./time-questions";
import { generateSyllabeAttaqueQuestion } from "./syllabe-questions";
import { generateDénombrementQuestion } from "./count-questions";
import { generateKeyboardCountQuestion } from "./keyboard-count-questions";
import { generateEcouteLesNombresQuestion } from './number-listening-questions';
import { generateNombresComplexesQuestion } from './complex-number-questions';
import { generateLireLesNombresQuestion } from './reading-number-questions';
import { generateCurrencyQuestion } from './currency-questions';


export interface Question extends CalendarQuestion, MentalMathQuestion {
  type: 'qcm' | 'set-time' | 'count' | 'audio-qcm' | 'written-to-audio-qcm' | 'audio-to-text-input' | 'keyboard-count' | 'image-qcm' | 'click-date' | 'count-days' | 'compose-sum' | 'select-multiple';
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
  // For currency
  targetAmount?: number;
  cost?: number;
  paymentImages?: { name: string, image: string }[];
  items?: { name: string, image: string, value: number }[];
  correctValue?: number;
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
  level: SkillLevel;
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
  calculation?: CalculationSettings;
  currency?: CurrencySettings;
}

export async function generateQuestions(
  skill: string,
  count: number,
  settings?: AllSettings
): Promise<Question[]> {
  const promises: Promise<Question>[] = [];
  
  if (skill === 'time' && settings?.time) {
    for (let i = 0; i < count; i++) {
        promises.push(generateTimeQuestion(settings.time.level));
    }
    const questions = await Promise.all(promises);
    // Important: Attach the settings object to each question for stable reference
    return questions.map(q => ({...q, timeSettings: settings.time}));
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
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
        questions.push(await generateLireLesNombresQuestion(settings.numberLevel!));
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
  
  if (skill === 'currency' && settings?.currency) {
      const questions: Question[] = [];
      for (let i = 0; i < count; i++) {
        questions.push(await generateCurrencyQuestion(settings.currency!));
      }
      return questions;
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
