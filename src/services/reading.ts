// src/services/reading.ts
'use server';

import fs from 'fs/promises';
import path from 'path';

const textsDirectory = path.join(process.cwd(), 'public/fluence');

export async function getAvailableTexts(): Promise<string[]> {
  try {
    const filenames = await fs.readdir(textsDirectory);
    return filenames.filter(filename => filename.endsWith('.txt'));
  } catch (error) {
    console.error('Failed to read texts directory:', error);
    return [];
  }
}

export async function getTextContent(filename: string): Promise<string> {
  try {
    const filePath = path.join(textsDirectory, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read text file ${filename}:`, error);
    return '';
  }
}
