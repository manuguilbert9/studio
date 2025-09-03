
'use server';

import type { AntonymEntry } from '@/services/vocabulary.types';
import fs from 'fs/promises';
import path from 'path';


export async function getAntonymPairs(): Promise<AntonymEntry[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'vocabulaire', 'contraires.txt');
    const fileContent: string = await fs.readFile(filePath, 'utf-8');
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
