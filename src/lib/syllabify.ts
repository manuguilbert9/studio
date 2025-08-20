
// A simplified French syllabification algorithm inspired by the rules of LireCouleur.
// This is not a perfect or comprehensive implementation, but it handles many common cases.

const vowels = 'aàâäeéèêëiîïoôöuùûüqy';
const consonants = 'zrtpqsdfghjklmwxcvbn';
const separators = "-'’";

// Sounds that are treated as a single vowel sound (digraphs, trigraphs)
const vowelGroups = ['au', 'eau', 'ou', 'oi', 'oeu', 'œu', 'ain', 'ein', 'oin', 'an', 'en', 'on', 'un', 'in', 'ai', 'ei', 'eu', 'œ'];
// Sounds that are treated as a single consonant sound
const consonantGroups = ['ch', 'ph', 'gn', 'th', 'rh', 'sc'];

// Function to split a word into phonetic groups (approximated)
function toPhoneticGroups(word: string): string[] {
    const groups: string[] = [];
    let i = 0;
    const lowerWord = word.toLowerCase();

    while (i < lowerWord.length) {
        // Check for 3-letter groups first
        const threeLetters = lowerWord.substring(i, i + 3);
        if (vowelGroups.includes(threeLetters)) {
            groups.push(word.substring(i, i + 3));
            i += 3;
            continue;
        }

        // Check for 2-letter groups
        const twoLetters = lowerWord.substring(i, i + 2);
        if (vowelGroups.includes(twoLetters) || consonantGroups.includes(twoLetters)) {
            groups.push(word.substring(i, i + 2));
            i += 2;
            continue;
        }

        // Otherwise, add the single letter
        groups.push(word.substring(i, i + 1));
        i += 1;
    }
    return groups;
}

function isVowel(group: string): boolean {
    if (!group) return false;
    const firstChar = group.toLowerCase().charAt(0);
    // Handle 'y' as a vowel unless it's followed by another vowel
    if (firstChar === 'y' && group.length > 1 && vowels.includes(group.toLowerCase().charAt(1))) {
        return false;
    }
    return vowels.includes(firstChar);
}

function isConsonant(group: string): boolean {
    if (!group) return false;
    const firstChar = group.toLowerCase().charAt(0);
    return consonants.includes(firstChar);
}

export function syllabify(word: string): string[] {
    if (!word || separators.includes(word)) {
        return [word];
    }
    
    // Clean the word from common punctuation that could interfere.
    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if(cleanedWord.length <= 2) {
        return [cleanedWord];
    }

    const groups = toPhoneticGroups(cleanedWord);
    if (groups.length <= 1) {
        return [cleanedWord];
    }

    const syllables: string[] = [];
    let currentSyllable = "";

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const nextGroup = groups[i + 1];
        const twoNextGroup = groups[i + 2];

        currentSyllable += group;

        // Rule: V-C-V -> cut before C (e.g., a-mour)
        if (isVowel(group) && isConsonant(nextGroup) && isVowel(twoNextGroup)) {
            syllables.push(currentSyllable);
            currentSyllable = "";
            continue;
        }
        
        // Rule: V-C-C-V -> cut between C-C (e.g., par-tir)
        if (isVowel(group) && isConsonant(nextGroup) && isConsonant(twoNextGroup) && isVowel(groups[i+3])) {
             currentSyllable += nextGroup;
             syllables.push(currentSyllable);
             currentSyllable = "";
             i++; // consume nextGroup
             continue;
        }

        // Rule: End of word. If the current syllable is not empty, push it.
        if (!nextGroup) {
            if (currentSyllable) {
                syllables.push(currentSyllable);
                currentSyllable = "";
            }
            continue;
        }

        // Rule: if a vowel is followed by another vowel, cut. (e.g., a-érien)
        if(isVowel(group) && isVowel(nextGroup)) {
            syllables.push(currentSyllable);
            currentSyllable = "";
            continue;
        }
    }
    
    if (currentSyllable) {
        syllables.push(currentSyllable);
    }

    // Post-processing: a lone consonant at the end should be merged with the previous syllable.
    if (syllables.length > 1) {
        const lastSyllable = syllables[syllables.length - 1];
        if (isConsonant(lastSyllable) && !isVowel(lastSyllable)) {
             syllables[syllables.length - 2] += lastSyllable;
             syllables.pop();
        }
    }
    
    // Post-processing: a silent 'e' at the end of a syllable with more than one letter is often part of it.
    // This is very complex, so here's a simplification: merge a trailing 'e' or 'es' if it follows a consonant.
    if (syllables.length > 1) {
        const lastSyllable = syllables[syllables.length - 1].toLowerCase();
        if (lastSyllable === 'e' || lastSyllable === 'es') {
             const secondLast = syllables[syllables.length-2];
             const lastCharOfSecondLast = secondLast.charAt(secondLast.length - 1);
             if (isConsonant(lastCharOfSecondLast)) {
                syllables[syllables.length - 2] += syllables.pop();
             }
        }
    }


    return syllables.filter(s => s.length > 0);
}
