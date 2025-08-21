
'use client';

// This is a simplified implementation inspired by the Maximal Onset Principle.
// It is not a direct port of a specific library but follows similar logic.

const VOWELS = "aàâäeéèêëiîïoôöuùûüyÿœæ";
const CONSONANTS = "bcdfghjklmnpqrstvwxzç";

// Common consonant clusters that can start a syllable in French.
const ONSETS = new Set([
    'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gn', 
    'gr', 'ph', 'pl', 'pr', 'qu', 'th', 'tr', 'vr', 'sch', 'sh', 'sk', 'sp', 'st'
]);

function isVowel(char: string): boolean {
    return VOWELS.includes(char.toLowerCase());
}

function isConsonant(char: string): boolean {
    return CONSONANTS.includes(char.toLowerCase());
}

function normalize(text: string): string {
  // Removes accents for analysis, but we will cut the original string.
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Splits a word into syllables based on the Maximal Onset Principle.
 * @param word The word to syllabify.
 * @returns An array of strings, where each string is a syllable.
 */
export function syllabifyWord(word: string): string[] {
    if (word.length <= 2) {
        return [word];
    }

    const syllables: string[] = [];
    const normalizedWord = normalize(word);
    let currentSyllableStart = 0;

    for (let i = 1; i < normalizedWord.length; i++) {
        // Find a vowel, which is the core of a syllable
        if (isVowel(normalizedWord[i])) {
            let onsetStart = i;
            // Look behind to find the start of the consonant cluster (onset)
            while (onsetStart > currentSyllableStart && isConsonant(normalizedWord[onsetStart - 1])) {
                onsetStart--;
            }

            const cluster = normalizedWord.substring(onsetStart, i);
            let cutPoint = onsetStart;

            // Apply Maximal Onset Principle
            if (cluster.length >= 2) {
                 if (ONSETS.has(cluster.slice(-2))) { // Check if last two consonants form a valid onset
                    cutPoint = i - 2;
                } else if(ONSETS.has(cluster)) { // Check if the whole cluster is a valid onset
                    cutPoint = onsetStart;
                }
                else { // If not, the first consonant belongs to the previous syllable
                    cutPoint = onsetStart + 1;
                }
            } else {
                // If only one consonant, it belongs to the new syllable
                 cutPoint = onsetStart;
            }
           
            // Ensure we don't cut in the middle of the previous syllable
            if (cutPoint > currentSyllableStart) {
                syllables.push(word.substring(currentSyllableStart, cutPoint));
                currentSyllableStart = cutPoint;
            }
        }
    }

    // Add the rest of the word as the last syllable
    syllables.push(word.substring(currentSyllableStart));

    return syllables;
}
