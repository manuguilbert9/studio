'use server';

import fs from 'fs/promises';
import path from 'path';

const textsDirectory = path.join(process.cwd(), 'public/fluence');

export async function getAvailableTexts(): Promise<Record<string, string[]>> {
  try {
    const levels = await fs.readdir(textsDirectory, { withFileTypes: true });
    const textsByLevel: Record<string, string[]> = {};

    for (const level of levels) {
      if (level.isDirectory()) {
        const levelPath = path.join(textsDirectory, level.name);
        const filenames = await fs.readdir(levelPath);
        textsByLevel[level.name] = filenames.filter(filename => filename.endsWith('.txt'));
      }
    }
    return textsByLevel;
  } catch (error) {
    console.error('Failed to read texts directory:', error);
    return {};
  }
}

export async function getTextContent(level: string, filename: string): Promise<string> {
  try {
    // Basic security check to prevent path traversal
    if (filename.includes('..') || level.includes('..')) {
      throw new Error('Invalid path');
    }
    const filePath = path.join(textsDirectory, level, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read text file ${filename} in level ${level}:`, error);
    return '';
  }
}
