
'use server';

import type { AntonymEntry } from '@/services/vocabulary.types';
import fs from 'fs/promises';
import path from 'path';


export async function getAntonymPairs(): Promise<AntonymEntry[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'vocabulaire', 'contraires.txt');
    const fileContent: string = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    const pairs: AntonymEntry[] = lines.map(line => {
      // Remove numbering like "1. " at the start of the line, and handle lines that might not have it.
      const cleanLine = line.replace(/^\d+\.\s*/, '').trim();

      // Ensure the line has the correct format before splitting.
      if (!cleanLine.includes(':') || !cleanLine.split(':')[1].trim()) {
        console.warn(`Ligne malformée ignorée dans contraires.txt : "${line}"`);
        return null;
      }
      
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
    // Fallback attempt using fetch if fs fails (e.g. in some serverless environments)
     try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(new URL('/vocabulaire/contraires.txt', process.env.VERCEL_URL || 'http://localhost:3000'));
        if (!response.ok) throw new Error('Failed to fetch fallback file');
        const fileContent = await response.text();
        const lines = fileContent.split('\n').filter(line => line.trim() !== '' && line.includes(':'));
        const pairs: AntonymEntry[] = lines.map(line => {
          const cleanLine = line.replace(/^\d+\.\s*/, '');
          const parts = cleanLine.split(':');
          if (parts.length < 2) return null;
          const word = parts[0].trim();
          const allOpposites = parts[1].split(',').map(s => s.trim()).filter(Boolean);
          const [opposite, ...distractors] = allOpposites;
          if (!word || !opposite) return null;
          return { word, opposite, distractors };
        }).filter((p): p is AntonymEntry => p !== null);
        return pairs;
    } catch (fetchError) {
        console.error('Fallback fetch for "contraires.txt" also failed:', fetchError);
        return [];
    }
  }
}
