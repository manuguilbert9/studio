
export interface Question {
  type: 'qcm' | 'set-time' | 'count';
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

export interface AllSettings {
  time?: TimeSettings;
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

function generateDénombrementQuestion(): Question {
  const emojis = ['🍎', '🍌', '🚗', '🚜', '🍓', '🍊', '🚓', '🚑'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const count = Math.floor(Math.random() * (19 - 3 + 1)) + 3; // 3 to 19

  return {
    type: 'count',
    question: `Combien y a-t-il de ${emoji} ?`,
    countEmoji: emoji,
    countNumber: count,
    answer: String(count),
  };
}


export function generateQuestions(
  skill: string,
  count: number,
  settings?: AllSettings
): Question[] {
  if (skill === 'time' && settings?.time) {
    return Array.from({ length: count }, () =>
      generateTimeQuestion(settings.time!)
    );
  }
  
  if (skill === 'dénombrement') {
      return Array.from({ length: count }, () => generateDénombrementQuestion());
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
