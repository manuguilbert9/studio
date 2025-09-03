

'use server';

import type { AntonymEntry } from '@/services/vocabulary.types';
// @ts-ignore
import antonymsFile from '@/data/public/vocabulaire/contraires.txt';

export async function getAntonymPairs(): Promise<AntonymEntry[]> {
  try {
    const fileContent: string = antonymsFile;
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
