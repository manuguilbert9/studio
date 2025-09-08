

import { numberToFrench, numberToWords } from "./utils";
import type { SkillLevel } from './skills';


export interface Question {
  type: 'qcm' | 'set-time' | 'count' | 'audio-qcm' | 'written-to-audio-qcm' | 'audio-to-text-input' | 'keyboard-count' | 'letter-sound-qcm';
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

function generateTimeQuestion(settings: TimeSettings): Question {
  const { difficulty } = settings;
  let hour: number;
  let minute: number;

  const questionTypeRandomizer = Math.random();

  // Determine hour based on difficulty
  if (difficulty < 2) {
    // Levels 1-2
    hour = Math.floor(Math.random() * 13); // 0-12
  } else {
    // Levels 3-4
    hour = Math.floor(Math.random() * 24); // 0-23
  }

  // Determine minute based on difficulty
  switch (difficulty) {
    case 0: // Level 1: :00 or :30
      minute = Math.random() < 0.5 ? 0 : 30;
      break;
    case 1: // Level 2: :00 :15 :30 :45
      minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      break;
    case 2: // Level 3: multiples of 5
      minute = Math.floor(Math.random() * 12) * 5;
      break;
    case 3: // Level 4: any minute
    default:
      minute = Math.floor(Math.random() * 60);
      break;
  }

  // 50% QCM, 50% set-time
  if (questionTypeRandomizer < 0.5) {
    // QCM Question
    const answerHour = hour;
    let displayHour = hour % 12;
    if (displayHour === 0 && hour > 0) displayHour = 12; // noon
    if (hour === 0) displayHour = 12; // midnight display

    const answer = `${answerHour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
    const options = new Set<string>([answer]);

    // Add trap answer for levels >= 2
    if (difficulty >= 1) {
      if (
        minute > 0 &&
        minute <= 12 * 5 &&
        displayHour > 0 &&
        displayHour <= 12
      ) {
        let trapHour = minute / 5;
        if (trapHour === 0) trapHour = 12;

        const trapMinute = (displayHour % 12) * 5;

        if (hour >= 13 && trapHour > 0 && trapHour < 12) {
          trapHour += 12;
        }
        // morning 12 stays 12

        const trapOption = `${trapHour
          .toString()
          .padStart(2, '0')}:${trapMinute.toString().padStart(2, '0')}`;
        if (trapOption !== answer) {
          options.add(trapOption);
        }
      }
    }

    while (options.size < 4) {
      let wrongHour: number;
      if (difficulty >= 2) {
        wrongHour = Math.floor(Math.random() * 24);
      } else {
        wrongHour = Math.floor(Math.random() * 13);
      }
      const wrongMinute = Math.floor(Math.random() * 12) * 5;
      const wrongOption = `${wrongHour
        .toString()
        .padStart(2, '0')}:${wrongMinute.toString().padStart(2, '0')}`;

      if (wrongOption !== answer) {
        options.add(wrongOption);
      }
    }

    return {
      type: 'qcm',
      question: "Quelle heure est-il sur l'horloge ?",
      hour: displayHour,
      minute,
      options: Array.from(options).sort(() => Math.random() - 0.5),
      answer,
      timeSettings: settings,
    };
  } else {
    // Set-Time Question
    return {
      type: 'set-time',
      question: `Réglez l'horloge sur ${hour
        .toString()
        .padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      hour,
      minute,
      timeSettings: settings,
    };
  }
}

function generateDénombrementQuestion(settings: CountSettings): Question {
  const items = [
    { emoji: '🍎', name: 'pommes' },
    { emoji: '🍌', name: 'bananes' },
    { emoji: '🚗', name: 'voitures' },
    { emoji: '🚜', name: 'tracteurs' },
    { emoji: '🍓', name: 'fraises' },
    { emoji: '🍊', name: 'oranges' },
    { emoji: '🚓', name: 'voitures de police' },
    { emoji: '🚑', name: 'ambulances' }
  ];
  const selectedItem = items[Math.floor(Math.random() * items.length)];
  const max = settings.maxNumber || 19;
  const count = Math.floor(Math.random() * (max - 3 + 1)) + 3; 

  return {
    type: 'count',
    question: `Combien y a-t-il de ${selectedItem.name} ?`,
    countEmoji: selectedItem.emoji,
    countNumber: count,
    answer: String(count),
    // Pass settings for result analysis
    countSettings: settings,
  };
}

function generateKeyboardCountQuestion(): Question {
  const items = [
    { emoji: '🍎', name: 'pommes' },
    { emoji: '🍌', name: 'bananes' },
    { emoji: '🚗', name: 'voitures' },
    { emoji: '🚜', name: 'tracteurs' },
    { emoji: '🍓', name: 'fraises' },
    { emoji: '🍊', name: 'oranges' },
    { emoji: '🚓', name: 'voitures de police' },
    { emoji: '🚑', name: 'ambulances' }
  ];
  const selectedItem = items[Math.floor(Math.random() * items.length)];
  const count = Math.floor(Math.random() * 9) + 1; // 1-9 for single digit keyboard press

  return {
    type: 'keyboard-count',
    question: `Combien y a-t-il de ${selectedItem.name} ?`,
    countEmoji: selectedItem.emoji,
    countNumber: count,
    answer: String(count),
  };
}

function generateEcouteLesNombresQuestion(): Question {
  const answerNumber = Math.floor(Math.random() * 20) + 1; // 1 to 20
  const answerText = String(answerNumber);
  
  const options = new Set<string>([answerText]);
  while (options.size < 4) {
    const wrongNumber = Math.floor(Math.random() * 20) + 1;
    options.add(String(wrongNumber));
  }
  
  const numberInFrench = numberToFrench[answerNumber] || answerText;

  return {
    type: 'audio-qcm',
    question: "Clique sur le nombre que tu entends.",
    options: Array.from(options).sort(() => Math.random() - 0.5),
    answer: answerText,
    textToSpeak: numberInFrench,
  };
}

// Generates questions for the "nombres-complexes" skill (60-99)
function generateNombresComplexesQuestion(): Question {
    const questionType = Math.random();
    const answerNumber = Math.floor(Math.random() * 40) + 60; // 60 to 99
    const answerText = String(answerNumber);
    const answerAudio = numberToFrench[answerNumber] || answerText;

    // 1. Dictée de nombres
    if (questionType < 0.25) {
        return {
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
            type: 'audio-qcm',
            question: "Clique sur le nombre que tu entends.",
            options: Array.from(options).map(String).sort(() => Math.random() - 0.5),
            answer: answerText,
            textToSpeak: answerAudio,
        };
    }
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
        if (len > 3) {
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
            type: 'audio-qcm',
            question: "Clique sur le nombre que tu entends.",
            options: allOptions.map(String).sort(() => Math.random() - 0.5),
            answer: answerText,
            textToSpeak: answerAudio,
            numberLevelSettings: settings
        };
    }
}

const letterSoundData: { [letter: string]: string[] } = {
  'a': ['arbre', 'avion', 'ananas'],
  'b': ['banane', 'bateau', 'ballon'],
  'c': ['cochon', 'canard', 'camion'], // [k] sound
  'd': ['dé', 'domino', 'dinosaure'],
  'e': ['escargot', 'éléphant', 'échelle'],
  'f': ['fusée', 'fourmi', 'fraise'],
  'g': ['gâteau', 'gomme', 'girafe'], // [g] sound
  'i': ['igloo', 'île', 'image'],
  'j': ['jupe', 'jardin', 'jouet'],
  'l': ['lune', 'lit', 'lion'],
  'm': ['maison', 'moto', 'montagne'],
  'n': ['nid', 'nuage', 'nez'],
  'o': ['orange', 'olive', 'ordinateur'],
  'p': ['pomme', 'poisson', 'papillon'],
  'r': ['robot', 'rat', 'robe'],
  's': ['serpent', 'soleil', 'sac'], // [s] sound
  't': ['tasse', 'table', 'téléphone'],
  'u': ['uniforme', 'usine'],
  'v': ['vélo', 'voiture', 'vache'],
  'z': ['zèbre', 'zéro', 'zoo'],
};


function generateLettresEtSonsQuestion(): Question {
    const letters = Object.keys(letterSoundData);
    const correctLetter = letters[Math.floor(Math.random() * letters.length)];
    const correctWords = letterSoundData[correctLetter];
    const correctWord = correctWords[Math.floor(Math.random() * correctWords.length)];

    const distractorLetters = letters.filter(l => l !== correctLetter);
    
    const options = new Set<string>([correctWord]);

    while (options.size < 4) {
        const randomLetter = distractorLetters[Math.floor(Math.random() * distractorLetters.length)];
        const randomWords = letterSoundData[randomLetter];
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        options.add(randomWord);
    }
    
    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

    return {
        type: 'written-to-audio-qcm',
        question: "Dans quel mot entends-tu le son de la lettre ?",
        answer: correctWord,
        textToSpeak: correctLetter, // Will show the letter
        optionsWithAudio: shuffledOptions.map(word => ({
            text: word, // The text for the radio button will be the word itself, but we won't show it.
            audio: word // The audio to play will be the word.
        })),
    };
}


export async function generateQuestions(
  skill: string,
  count: number,
  settings?: AllSettings
): Promise<Question[]> {
  if (skill === 'time' && settings?.time) {
    return Array.from({ length: count }, () =>
      generateTimeQuestion(settings.time!)
    );
  }
  
  if (skill === 'denombrement' && settings?.count) {
      return Array.from({ length: count }, () => generateDénombrementQuestion(settings.count!));
  }

  if (skill === 'keyboard-count') {
      return Array.from({ length: count }, () => generateKeyboardCountQuestion());
  }

  if (skill === 'ecoute-les-nombres') {
      return Array.from({ length: count }, () => generateEcouteLesNombresQuestion());
  }

  if (skill === 'nombres-complexes') {
      return Array.from({ length: count }, () => generateNombresComplexesQuestion());
  }
  
  if (skill === 'lire-les-nombres' && settings?.numberLevel) {
      return Array.from({ length: count }, () => generateLireLesNombresQuestion(settings.numberLevel!));
  }
  
  if (skill === 'lettres-et-sons') {
    return Array.from({ length: count }, () => generateLettresEtSonsQuestion());
  }

  // Fallback
  return Array.from({ length: count }, () => ({
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
