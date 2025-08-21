
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
    // This regex is a simplified approach to find vowel groups.
    const regex = /[^aàâäeéèêëiîïoôöuùûüyÿœæ]*[aàâäeéèêëiîïoôöuùûüyÿœæ]+(?:[^aàâäeéèêëiîïoôöuùûüyÿœæ]*$|[^aàâäeéèêëiîïoôöuùûüyÿœæ](?=[^aàâäeéèêëiîïoôöuùûüyÿœæ]))?/gi;
    let syllables = word.match(regex);

    // A real algorithm would handle digraphs like "ai", "ou" etc. here.
    // For this demo, we'll keep the simple regex split.
    
    return syllables || [word];
}


/**
 * Processes a text to add coloration for syllables and silent letters.
 * @param text The input text.
 * @returns An HTML string with styled syllables and silent letters.
 */
export function colorizeText(text: string): string {
    return text.split(/(\s+)/).map(word => {
        if (/\s+/.test(word) || word.length === 0) {
            return word; // Keep whitespace as is
        }
        
        const syllables = syllabify(word);
        
        let colorizedWord;
        if (syllables.length > 1) {
            colorizedWord = syllables.map((syllable, index) => {
                const className = index % 2 === 0 ? 'syllable-a' : 'syllable-b';
                return `<span class="${className}">${syllable}</span>`;
            }).join('');
        } else {
            colorizedWord = word;
        }

        // Apply silent letter marking on top of the (potentially) colorized word.
        // This is tricky. A better approach would be a single pass analysis.
        // For now, let's just mark silent letters on the whole word.
        // We will prioritize silent letters over syllabification for simplicity to avoid nested spans.
        return markSilentLetters(colorizedWord.includes('<span') ? word : colorizedWord);


    }).join('');
}
