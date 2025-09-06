
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'é', 'è', 'ê'];
const CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'j', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v'];

// Function to get a random item from an array
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates an array of simple syllables.
 * @param count The number of syllables to generate.
 * @returns An array of syllable strings.
 */
export function generateSyllables(count: number): string[] {
  const syllables = new Set<string>();

  while (syllables.size < count) {
    const isCV = Math.random() > 0.5; // 50% chance for Consonant-Vowel, 50% for Vowel-Consonant
    const vowel = getRandomItem(VOWELS);
    const consonant = getRandomItem(CONSONANTS);

    let newSyllable: string;
    if (isCV) {
      newSyllable = `${consonant}${vowel}`;
    } else {
      newSyllable = `${vowel}${consonant}`;
    }

    syllables.add(newSyllable);
  }

  return Array.from(syllables);
}
