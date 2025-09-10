
'use server';

import type { Question } from './questions';
import { syllableAttackData } from './syllable-data';

export async function generateSyllabeAttaqueQuestion(): Promise<Question> {
    const dataCopy = [...syllableAttackData];
    const randomIndex = Math.floor(Math.random() * dataCopy.length);
    const correctItem = dataCopy.splice(randomIndex, 1)[0];

    const distractors = new Set<{ src: string, alt: string, hint?: string }>();
    while (distractors.size < 2) {
        const randomDistractor = dataCopy[Math.floor(Math.random() * dataCopy.length)];
        // Ensure distractor doesn't start with the same syllable and isn't the same word
        if (!randomDistractor.word.startsWith(correctItem.syllable) && randomDistractor.word !== correctItem.word) {
            distractors.add({ src: randomDistractor.image, alt: randomDistractor.word, hint: randomDistractor.word });
        }
    }
    
    const imageOptions = [
        { src: correctItem.image, alt: correctItem.word, hint: correctItem.word },
        ...Array.from(distractors)
    ].sort(() => Math.random() - 0.5);

    return {
        id: Date.now(),
        level: 'A',
        type: 'image-qcm',
        question: 'Clique sur l\'image qui commence par la syllabe :',
        syllable: correctItem.syllable,
        answer: correctItem.word,
        images: imageOptions,
    };
}
