
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
      // Remove numbering like "1. " at the start of the line
      const cleanLine = line.replace(/^\d+\.\s*/, '');
      const parts = cleanLine.split(':');
      if (parts.length < 2) {
        return null;
      }
      const word = parts[0].trim();
      // The first word after the colon is the main opposite, the rest are distractors
      const allOpposites = parts[1].split(',').map(s => s.trim()).filter(Boolean);
      
      const [opposite, ...distractors] = allOpposites;

      if (!word || !opposite) {
        return null;
      }

      return { word, opposite, distractors };
    }).filter((p): p is AntonymEntry => p !== null);

    return pairs;
  } catch (error) {
    console.error('Failed to read or parse "contraires.txt":', error);
    return [];
  }
}
