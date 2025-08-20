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
    'ch', 'ph', 'th', 'sh', 'gn', 'qu', 'gu', 'sc', 'sp', 'st', 'sk', 'str'
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
        const g1 = groups[i];
        const g2 = groups[i + 1];
        const g3 = groups[i + 2];
        const g4 = groups[i + 3];
        
        currentSyllable += g1;

        let shouldCut = false;
        
        // --- Cutting logic ---
        if (!g2) { // End of word
            shouldCut = true;
        } else if (isVowel(g1) && isVowel(g2)) { // V-V
            shouldCut = true;
        } else if (isVowel(g1) && isConsonant(g2) && isVowel(g3)) { // V-C-V
            shouldCut = true;
        } else if (isVowel(g1) && isConsonant(g2) && isConsonant(g3) && isVowel(g4)) { // V-CC-V
             // Handle 'x' as 'ks' sound, splitting it.
            if (g2.toLowerCase() === 'x') {
                currentSyllable += 'x';
                i++;
            } else if (ONSET_OK.has((g2 + g3).toLowerCase())) {
                 // If C1+C2 is a valid onset, cut before C1 (e.g., a-pres)
                 shouldCut = true;
            } else { 
                // Otherwise, cut between C1 and C2 (e.g., por-te)
                currentSyllable += g2;
                i++;
            }
            shouldCut = true;
        } else if (isVowel(g1) && isConsonant(g2) && isConsonant(g3) && isConsonant(g4) && isVowel(groups[i+4])) { // V-CCC-V
            if(ONSET_OK.has((g3+g4).toLowerCase())) { // C2+C3 is licit onset -> C1 | C2C3V (abs-trait)
                currentSyllable += g2;
                i++;
            } else { // C1C2 | C3V (arc-tique)
                currentSyllable += g2 + g3;
                i += 2;
            }
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
    
    const result: string[] = [];
    let tempSyllables = [...syllables];

    // Merge a trailing silent 'e' or 'es'
    if (tempSyllables.length > 1) {
        const last = tempSyllables[tempSyllables.length - 1];
        if (last.toLowerCase() === 'e' || last.toLowerCase() === 'es') {
            const secondLast = tempSyllables[tempSyllables.length - 2];
            // Only merge if the second to last syllable ends with a consonant
            if (isConsonant(secondLast[secondLast.length - 1])) {
                 tempSyllables[tempSyllables.length - 2] += last;
                 tempSyllables.pop();
            }
        }
    }
    
    // Merge a single trailing consonant
    if (tempSyllables.length > 1) {
        const last = tempSyllables[tempSyllables.length - 1];
        if (isConsonant(last) && last.length === 1) {
             tempSyllables[tempSyllables.length - 2] += last;
             tempSyllables.pop();
        }
    }

    // If processing resulted in something strange, fallback to the original word.
    if (tempSyllables.join('') !== originalWord) {
        // This is a basic fallback. More sophisticated reconstruction might be needed.
        return [originalWord];
    }

    return tempSyllables.filter(s => s.length > 0);
}
