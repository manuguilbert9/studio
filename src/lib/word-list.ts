
const simpleWords = [
  'le', 'la', 'un', 'une', 'ma', 'sa', 'ta', 'mon', 'son', 'ton', 'il', 'elle',
  'a', 'ami', 'papa', 'papi', 'lune', 'robe', 'école', 'livre', 'tasse', 'moto',
  'vélo', 'rat', 'riz', 'sac', 'sol', 'mur', 'lit', 'bus', 'dame', 'rue', 'niche',
  'page', 'neige', 'fille', 'roi', 'loi', 'plat', 'train', 'fleur', 'chat', 'chien',
  'table', 'chaise', 'pomme', 'poire', 'banane', 'sucre', 'café', 'lettre', 'chou',
  'feu', 'jeu', 'balle', 'os', 'jus', 'lait', 'pain', 'vin', 'fort', 'doux', 'bébé'
];


/**
 * Gets a specified number of unique, randomly selected simple words.
 * @param count The number of words to get.
 * @returns An array of simple word strings.
 */
export function getSimpleWords(count: number): string[] {
  // Shuffle the array
  const shuffled = simpleWords.sort(() => 0.5 - Math.random());
  // Get the first `count` elements
  return shuffled.slice(0, count);
}
