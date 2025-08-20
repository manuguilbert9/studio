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
    const lowerGroup = group.toLowerCase();
    
    // Check if the whole group is a vowel group
    if (vowelGroups.includes(lowerGroup)) return true;

    const firstChar = lowerGroup.charAt(0);
    // Handle 'y' as a vowel unless it's followed by another vowel
    if (firstChar === 'y' && group.length > 1 && vowels.includes(lowerGroup.charAt(1))) {
        return false;
    }
    return vowels.includes(firstChar);
}

function isConsonant(group: string): boolean {
    if (!group) return false;
    const lowerGroup = group.toLowerCase();
    
    if (consonantGroups.includes(lowerGroup)) return true;

    // A group like 'an' is a vowel, not a consonant
    if(vowelGroups.includes(lowerGroup)) return false;

    const firstChar = lowerGroup.charAt(0);
    return consonants.includes(firstChar);
}

export function syllabify(word: string): string[] {
    if (!word || separators.includes(word)) {
        return [word];
    }
    
    // Clean the word from common punctuation that could interfere.
    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if(cleanedWord.length <= 3) {
        return [cleanedWord];
    }

    const groups = toPhoneticGroups(cleanedWord);
    if (groups.length <= 1) {
        return [cleanedWord];
    }

    const syllables: string[] = [];
    let currentSyllable = "";
    let i = 0;

    while (i < groups.length) {
        const group = groups[i];
        currentSyllable += group;

        const nextGroup = groups[i + 1];
        const nextNextGroup = groups[i + 2];

        // End of word
        if (!nextGroup) {
            syllables.push(currentSyllable);
            break;
        }

        // Rule V-V: cut between vowels (e.g., a-érien)
        if (isVowel(group) && isVowel(nextGroup)) {
            syllables.push(currentSyllable);
            currentSyllable = "";
        }
        // Rule V-C-V: cut before the consonant (e.g., a-mour)
        else if (isVowel(group) && isConsonant(nextGroup) && isVowel(nextNextGroup)) {
            syllables.push(currentSyllable);
            currentSyllable = "";
        }
        // Rule V-C-C-V: cut between consonants (e.g., par-tir)
        // Exception: consonant groups like 'ch', 'ph' are not split
        else if (isVowel(group) && isConsonant(nextGroup) && isConsonant(nextNextGroup) && isVowel(groups[i + 3])) {
            currentSyllable += nextGroup;
            syllables.push(currentSyllable);
            currentSyllable = "";
            i++; // consume nextGroup
        }
        // Rule C-V: continue building syllable
        else if (isConsonant(group) && isVowel(nextGroup)) {
             // Let it continue to the next group
        }


        i++;
    }
    
    if (currentSyllable && syllables.join('') !== cleanedWord) {
        syllables.push(currentSyllable);
    }

    // --- Post-processing ---

    // Merge a trailing lone consonant
    if (syllables.length > 1) {
        const last = syllables[syllables.length - 1];
        if (isConsonant(last) && !isVowel(last)) {
            syllables[syllables.length - 2] += last;
            syllables.pop();
        }
    }
    
    // Merge a trailing silent 'e' or 'es'
    if (syllables.length > 1) {
        const last = syllables[syllables.length - 1];
        if (last.toLowerCase() === 'e' || last.toLowerCase() === 'es') {
             const prev = syllables[syllables.length-2];
             const lastCharOfPrev = prev.slice(-1).toLowerCase();
             // Check if the previous syllable ends with a consonant
             if (consonants.includes(lastCharOfPrev)) {
                syllables[syllables.length - 2] += last;
                syllables.pop();
             }
        }
    }
    
    // If the whole word is one syllable, return it
    if (syllables.join('').length !== cleanedWord.length) {
        return [cleanedWord];
    }


    return syllables.filter(s => s.length > 0);
}
