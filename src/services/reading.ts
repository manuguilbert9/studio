
'use server';

import fs from 'fs/promises';
import path from 'path';

// This function now reads from the filesystem on the server side.
// It assumes the 'public' directory is at the root of the project.
async function listFilesInDirectory(dir: string): Promise<string[]> {
    try {
        const directoryPath = path.join(process.cwd(), 'public', dir);
        const files = await fs.readdir(directoryPath);
        return files.filter(file => file.endsWith('.txt'));
    } catch (error) {
        console.error(`Could not read directory ${dir}:`, error);
        return [];
    }
}

export async function getAvailableTexts(): Promise<Record<string, string[]>> {
    const levels = ['CP', 'CE1']; // Add other levels here if needed
    const textsByLevel: Record<string, string[]> = {};
    for (const level of levels) {
        textsByLevel[level] = await listFilesInDirectory(`fluence/${level}`);
    }
    return textsByLevel;
}

export async function getTextContent(level: string, filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'fluence', level, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to get text content for ${filename} in level ${level}:`, error);
    return '';
  }
}
