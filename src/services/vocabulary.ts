

import type { AntonymEntry } from '@/services/vocabulary.types';

// This function now runs on the client-side
export async function getAntonymPairs(): Promise<AntonymEntry[]> {
  try {
    const response = await fetch('/vocabulaire/contraires.txt');
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const fileContent = await response.text();
    const lines = fileContent.split('\n').filter(line => line.trim() !== '' && line.includes(':'));
    
    const pairs: AntonymEntry[] = lines.map(line => {
      const cleanLine = line.replace(/^\d+\.\s*/, '');
      const parts = cleanLine.split(':');
      const word = parts[0].trim();
      const allOpposites = parts[1].split(',').map(s => s.trim());
      
      const [opposite, ...distractors] = allOpposites;

      return { word, opposite, distractors };
    });

    return pairs;
  } catch (error) {
    console.error('Failed to read or parse "contraires.txt":', error);
    return [];
  }
}
