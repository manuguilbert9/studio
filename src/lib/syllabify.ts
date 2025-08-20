// A French syllabification algorithm based on linguistic rules.
// This is a progressive implementation based on detailed specifications.

// --- Dictionaries & Constants ---
const VOWELS = 'aàâäeéèêëiîïoôöuùûüqyœæ';
const CONSONANTS = 'zrtpqsdfghjklmwxcvbn';
const SEPARATORS = "-'’";

// Sound groups treated as a single phonetic unit
const VOWEL_GROUPS = ['au', 'eau', 'ou', 'oi', 'oeu', 'œu', 'ain', 'ein', 'oin', 'an', 'en', 'on', 'un', 'in', 'ai', 'ei', 'eu', 'œ'];
const CONSONANT_GROUPS = ['ch', 'ph', 'gn', 'th', 'rh', 'sc', 'qu', 'gu'];

// Consonant clusters that can start a syllable (attaques licites)
const ONSET_OK = new Set([
    'pr', 'pl', 'br', 'bl', 'tr', 'dr', 'cr', 'cl', 'gr', 'gl', 'fr', 'fl', 'vr', 'vl',
    'ch', 'ph', 'th', 'sh', 'gn', 'qu', 'gu', 'sc', 'sp', 'st', 'sk'
]);


// --- Helper Functions ---

/**
 * Splits a word into phonetic groups (approximated).
 * e.g., "chateau" -> ["ch", "a", "t", "eau"]
 */
function toPhoneticGroups(word: string): string[] {
    const groups: string[] = [];
    let i = 0;
    const lowerWord = word.toLowerCase();

    while (i < lowerWord.length) {
        // Greedy check for 3-letter groups, then 2, then 1
        const three = lowerWord.substring(i, i + 3);
        if (VOWEL_GROUPS.includes(three)) {
            groups.push(word.substring(i, i + 3));
            i += 3;
            continue;
        }

        const two = lowerWord.substring(i, i + 2);
        if (VOWEL_GROUPS.includes(two) || CONSONANT_GROUPS.includes(two)) {
            groups.push(word.substring(i, i + 2));
            i += 2;
            continue;
        }

        groups.push(word.substring(i, i + 1));
        i += 1;
    }
    return groups;
}

function isVowel(group: string): boolean {
    if (!group) return false;
    const lowerGroup = group.toLowerCase();
    
    if (VOWEL_GROUPS.includes(lowerGroup)) return true;
    if (CONSONANT_GROUPS.includes(lowerGroup)) return false;

    // 'y' is a vowel unless it acts as a consonant (e.g., "yeux")
    if (lowerGroup.startsWith('y') && group.length > 1 && VOWELS.includes(lowerGroup[1])) {
        return false;
    }
    return VOWELS.includes(lowerGroup[0]);
}

function isConsonant(group: string): boolean {
    if (!group) return false;
    const lowerGroup = group.toLowerCase();
    
    if (CONSONANT_GROUPS.includes(lowerGroup)) return true;
    if (VOWEL_GROUPS.includes(lowerGroup)) return false;

    return CONSONANTS.includes(lowerGroup[0]);
}

// --- Core Syllabification Logic ---

export function syllabify(word: string): string[] {
    if (!word || SEPARATORS.includes(word)) {
        return [word];
    }
    
    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (cleanedWord.length <= 3) {
        return [cleanedWord];
    }

    // Step 1: Tokenize word into phonetic groups
    const groups = toPhoneticGroups(cleanedWord);
    if (groups.length <= 1) {
        return [cleanedWord];
    }

    // Step 2: Iterate through groups and apply cutting rules
    const syllables: string[] = [];
    let currentSyllable = "";
    let i = 0;

    while (i < groups.length) {
        const group = groups[i];
        const nextGroup = groups[i + 1];
        const nextNextGroup = groups[i + 2];
        
        currentSyllable += group;

        // --- Cutting logic ---
        let shouldCut = false;

        // Reached the end of the word
        if (!nextGroup) {
            shouldCut = true;
        } 
        // V-V cut
        else if (isVowel(group) && isVowel(nextGroup)) {
            shouldCut = true;
        }
        // V-C-V cut (cut before C)
        else if (isVowel(group) && isConsonant(nextGroup) && isVowel(nextNextGroup)) {
            shouldCut = true;
        }
        // V-CC-V cut
        else if (isVowel(group) && isConsonant(nextGroup) && isConsonant(nextNextGroup) && (isVowel(groups[i+3]) || !groups[i+3])) {
            // If C1+C2 is a valid onset, cut before C1 (e.g., a-pres)
            if (ONSET_OK.has((nextGroup + nextNextGroup).toLowerCase())) {
                 shouldCut = true;
            } else { // Otherwise, cut between C1 and C2 (e.g., por-te)
                currentSyllable += nextGroup;
                shouldCut = true;
                i++; // Consume nextGroup as it's part of the current syllable
            }
        }
        // Handle 'x' as 'ks' sound, splitting it.
        else if (group.toLowerCase() === 'x') {
            currentSyllable = currentSyllable.slice(0, -1) + 'x'; // simplified split
            shouldCut = true;
        }


        if (shouldCut) {
            syllables.push(currentSyllable);
            currentSyllable = "";
        }
        
        i++;
    }

    if (currentSyllable) {
        syllables.push(currentSyllable);
    }
    
    return postProcess(syllables, cleanedWord);
}


/**
 * Cleans up the generated syllables (merge silent 'e', etc.)
 */
function postProcess(syllables: string[], originalWord: string): string[] {
    if (syllables.length === 0) {
        return [originalWord];
    }
    
    // Merge a trailing silent 'e' or 'es'
    if (syllables.length > 1) {
        const last = syllables[syllables.length - 1];
        if (last.toLowerCase() === 'e' || last.toLowerCase() === 'es') {
            syllables[syllables.length - 2] += last;
            syllables.pop();
        }
    }
    
     // Merge a single trailing consonant
    if (syllables.length > 1) {
        const last = syllables[syllables.length - 1];
        if (isConsonant(last) && last.length === 1) {
             syllables[syllables.length - 2] += last;
             syllables.pop();
        }
    }

    // If processing resulted in something strange, fallback to the original word.
    if (syllables.join('') !== originalWord) {
        return [originalWord];
    }

    return syllables.filter(s => s.length > 0);
}
