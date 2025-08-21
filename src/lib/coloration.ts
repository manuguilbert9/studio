
'use client';

// This is a simplified simulation of what an advanced library like LireCouleur might do.
// It includes syllable coloring and marking silent letters.

/**
 * Marks silent letters in a word.
 * A very basic set of rules for demonstration.
 * - Final 'e' unless it's the only vowel
 * - Final 's', 'x', 'z' (plural markers)
 * - Final 't', 'd' (often silent)
 * - 'h' at the beginning of a word
 */
function markSilentLetters(word: string): string {
    if (word.length === 0) return '';

    // Rule: Mute 'h' at the start
    if (word.toLowerCase().startsWith('h')) {
        word = `<span class="letter-muette">${word[0]}</span>` + word.substring(1);
    }
    
    // Rules for final letters
    const lastLetter = word[word.length - 1].toLowerCase();
    const secondLast = word.length > 1 ? word[word.length - 2] : '';
    
    // Don't mark silent 'e' if it's part of a digraph like 'le', 'de', 'se'...
    if (word.length > 2 && lastLetter === 'e' && !'éèêë'.includes(word[word.length-1])) {
         word = word.slice(0, -1) + `<span class="letter-muette">e</span>`;
    }

    if (word.length > 2 && 'sxztpd'.includes(lastLetter)) {
        word = word.slice(0, -1) + `<span class="letter-muette">${word[word.length - 1]}</span>`;
    }
    
    // Silent 'ent' in verbs
    if (word.endsWith('ent') && word.length > 4) {
         word = word.slice(0, -3) + `<span class="letter-muette">ent</span>`;
    }


    return word;
}


/**
 * Splits a word into pseudo-syllables.
 * This is a very basic heuristic and not a full linguistic algorithm.
 */
function syllabify(word: string): string[] {
    if (word.length <= 3) {
        return [word];
    }
    // Very simple regex-based syllabification for demonstration
    // This is not linguistically accurate but provides a visual separation.
    const regex = /[^aeiouyéàèùâêîôûäëïöüÿ]*[aeiouyéàèùâêîôûäëïöüÿ]+(?:[^aeiouyéàèùâêîôûäëïöüÿ]*$|[^aeiouyéàèùâêîôûäëïöüÿ](?=[^aeiouyéàèùâêîôûäëïöüÿ]))?/gi;
    let syllables = word.match(regex);
    return syllables || [word];
}


/**
 * Processes a text to add coloration for syllables and silent letters.
 * @param text The input text.
 * @returns An HTML string with styled syllables and silent letters.
 */
export function colorizeText(text: string): string {
    const words = text.split(/(\s+)/); // Split by whitespace, keeping delimiters

    return words.map(word => {
        if (/\s+/.test(word) || word.length === 0) {
            // It's a whitespace, return as is
            return word;
        }

        // First, mark silent letters on the original word
        const wordWithSilentMarks = markSilentLetters(word);
        
        // Then, syllabify the "clean" word (without HTML marks)
        const syllables = syllabify(word);

        if (syllables.length <= 1) {
            return wordWithSilentMarks; // Return the word with just silent letters marked
        }

        // Colorize syllables
        const colorizedSyllables = syllables.map((syllable, index) => {
            const className = index % 2 === 0 ? 'syllable-a' : 'syllable-b';
            return `<span class="${className}">${syllable}</span>`;
        }).join('');
        
        // This is a simplification. A real library would merge silent letter
        // marks and syllable colors. For this demo, we prioritize syllable colors.
        // If a word has syllables, we return the colorized version without silent marks.
        // If it's one syllable, we return the version with silent marks.
        // This avoids nested spans issues.
        return colorizedSyllables;

    }).join('');
}
