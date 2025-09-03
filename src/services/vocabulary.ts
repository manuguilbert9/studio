
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface AntonymEntry {
  word: string;
  opposite: string;
  distractors: string[];
}

const vocabularyDirectory = path.join(process.cwd(), 'public', 'vocabulaire');

export async function getAntonymPairs(): Promise<AntonymEntry[]> {
  try {
    const filePath = path.join(vocabularyDirectory, 'contraires.txt');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '' && line.includes(':'));
    
    const pairs: AntonymEntry[] = lines.map(line => {
      // Remove numbering like "1. " from the start
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
