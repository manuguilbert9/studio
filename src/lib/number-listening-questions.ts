
'use server';

import type { Question } from './questions';
import { numberToFrench } from './utils';

export async function generateEcouteLesNombresQuestion(): Promise<Question> {
  const answerNumber = Math.floor(Math.random() * 20) + 1; // 1 to 20
  const answerText = String(answerNumber);
  
  const options = new Set<string>([answerText]);
  while (options.size < 4) {
    const wrongNumber = Math.floor(Math.random() * 20) + 1;
    options.add(String(wrongNumber));
  }
  
  const numberInFrench = numberToFrench[answerNumber] || answerText;

  return {
    id: Date.now(),
    level: 'A',
    type: 'audio-qcm',
    question: "Clique sur le nombre que tu entends.",
    options: Array.from(options).sort(() => Math.random() - 0.5),
    answer: answerText,
    textToSpeak: numberInFrench,
  };
}
