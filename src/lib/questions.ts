



import { numberToFrench, numberToWords } from "./utils";


export interface Question {
  type: 'qcm' | 'set-time' | 'count' | 'audio-qcm' | 'written-to-audio-qcm';
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

export interface NumberRangeSettings {
    min: number;
    max: number;
}

export interface AllSettings {
  time?: TimeSettings;
  count?: CountSettings;
  numberRange?: NumberRangeSettings;
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

// Generates questions for the "nombres-complexes" skill (70-99)
function generateNombresComplexesQuestion(): Question {
    const isReverse = Math.random() > 0.5;

    // Generate a "tricky" number between 70 and 99
    const answerNumber = Math.floor(Math.random() * 30) + 70;
    const answerText = String(answerNumber);
    const answerAudio = numberToFrench[answerNumber] || answerText;

    const options = new Set<number>([answerNumber]);

    // Generate "trap" options
    const tens = Math.floor(answerNumber / 10); // 7, 8, or 9
    const ones = answerNumber % 10;

    // Trap 1: wrong tens
    if (tens === 7) options.add(90 + ones);
    else if (tens === 9) options.add(70 + ones);
    else if (tens === 8) options.add(Math.random() > 0.5 ? 71 : 91); // 71 or 91 for 81
    
    // Trap 2: wrong ones
    if (tens === 7 || tens === 9) { // 7x and 9x
        if (ones > 0 && ones < 9) {
             options.add(tens * 10 + (ones + (Math.random() > 0.5 ? 1 : -1) ));
        }
    }

    // Fill with random other tricky numbers
    while (options.size < 4) {
        options.add(Math.floor(Math.random() * 30) + 70);
    }
    
    const allOptions = Array.from(options);

    if (isReverse) {
        // Written to Audio QCM
        return {
            type: 'written-to-audio-qcm',
            question: "Comment se prononce ce nombre ?",
            answer: answerText,
            textToSpeak: answerText, // The number to display
            optionsWithAudio: allOptions.sort(() => Math.random() - 0.5).map(num => ({
                text: String(num),
                audio: numberToFrench[num] || String(num)
            }))
        };
    } else {
        // Audio to Written QCM
        return {
            type: 'audio-qcm',
            question: "Clique sur le nombre que tu entends.",
            options: allOptions.map(String).sort(() => Math.random() - 0.5),
            answer: answerText,
            textToSpeak: answerAudio,
        };
    }
}

function generateLireLesNombresQuestion(settings: NumberRangeSettings): Question {
    const { min, max } = settings;
    const isReverse = Math.random() > 0.5;
    
    const answerNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    const answerText = String(answerNumber);
    const answerAudio = numberToWords(answerNumber);
    
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
            }))
        };
    } else {
        return {
            type: 'audio-qcm',
            question: "Clique sur le nombre que tu entends.",
            options: allOptions.map(String).sort(() => Math.random() - 0.5),
            answer: answerText,
            textToSpeak: answerAudio,
        };
    }
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

  if (skill === 'ecoute-les-nombres') {
      return Array.from({ length: count }, () => generateEcouteLesNombresQuestion());
  }

  if (skill === 'nombres-complexes') {
      return Array.from({ length: count }, () => generateNombresComplexesQuestion());
  }
  
  if (skill === 'lire-les-nombres' && settings?.numberRange) {
      return Array.from({ length: count }, () => generateLireLesNombresQuestion(settings.numberRange!));
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
