
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface AntonymPair {
  word: string;
  opposite: string;
}

const vocabularyDirectory = path.join(process.cwd(), 'public', 'vocabulaire');

export async function getAntonymPairs(): Promise<AntonymPair[]> {
  try {
    const filePath = path.join(vocabularyDirectory, 'contraires.txt');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '' && line.includes(','));
    
    const pairs: AntonymPair[] = lines.map(line => {
      const [word, opposite] = line.split(',').map(s => s.trim());
      return { word, opposite };
    });

    return pairs;
  } catch (error) {
    console.error('Failed to read or parse "contraires.txt":', error);
    // Return an empty array or throw the error, depending on desired error handling
    return [];
  }
}
