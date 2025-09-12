
'use server';

import type { Question } from './questions';

// This file is now deprecated and will not be used. 
// The logic has been moved to the component `src/components/lettres-et-sons-exercise.tsx`.
// It is kept for reference but can be deleted.

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
  'o': ['orange', 'olive', 'oreille'],
  'p': ['pomme', 'poisson', 'papillon'],
  'r': ['robot', 'rat', 'robe'],
  's': ['serpent', 'soleil', 'sac'], // [s] sound
  't': ['tasse', 'table', 'téléphone'],
  'u': ['usine'],
  'v': ['vélo', 'voiture', 'vache'],
  'z': ['zèbre', 'zéro', 'zoo'],
};


export async function generateLettresEtSonsQuestion(): Promise<Question> {
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
        id: Date.now(),
        level: 'A',
        type: 'written-to-audio-qcm',
        question: "Dans quel mot entends-tu le son de la lettre ?",
        answer: correctWord,
        textToSpeak: correctLetter, // Will show the letter
        optionsWithAudio: shuffledOptions.map(word => ({
            text: word, 
            audio: word 
        })),
    };
}
