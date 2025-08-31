
'use server';

import fs from 'fs/promises';
import path from 'path';

export interface SpellingList {
  id: string; // e.g., "D1"
  title: string; // e.g., "Les consonnes muettes en fin de mot"
  words: string[];
}

const spellingFileCache: { lists: SpellingList[] | null } = {
  lists: null,
};

// This function reads and parses the spelling list file.
// It uses a simple cache to avoid reading the file on every request in dev mode.
export async function getSpellingLists(): Promise<SpellingList[]> {
  if (spellingFileCache.lists) {
    return spellingFileCache.lists;
  }

  try {
    const filePath = path.join(process.cwd(), 'public/orthographe/listes_orthographe.txt');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    const lists: SpellingList[] = [];
    let currentList: SpellingList | null = null;

    for (const line of lines) {
      // A line starting with D followed by a number is a list header
      if (line.match(/^D\d+\s*–/)) {
        if (currentList) {
          lists.push(currentList);
        }
        const [id, title] = line.split('–').map(s => s.trim());
        currentList = { id, title, words: [] };
      } else if (currentList) {
        // Otherwise, it's a line of words for the current list
        const words = line.split(',').map(word => word.trim()).filter(Boolean);
        currentList.words.push(...words);
      }
    }
    // Add the last list
    if (currentList) {
      lists.push(currentList);
    }
    
    spellingFileCache.lists = lists;
    return lists;

  } catch (error) {
    console.error('Failed to read and parse spelling lists file:', error);
    return [];
  }
}

// --- LocalStorage Progress Functions ---

const SPELLING_PROGRESS_DB = 'SPELLING_PROGRESS_DB';

interface SpellingProgress {
  [userId: string]: {
    [exerciseId: string]: {
      completedAt: string;
      errors: string[];
    };
  };
}

export async function getSpellingProgress(userId: string): Promise<Record<string, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    const db = localStorage.getItem(SPELLING_PROGRESS_DB);
    if (!db) return {};
    const parsedDb: SpellingProgress = JSON.parse(db);
    const userProgress = parsedDb[userId] || {};
    // Return a simple map of exerciseId to completion status
    return Object.keys(userProgress).reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {} as Record<string, boolean>);
  } catch (e) {
    console.error("Failed to get spelling progress", e);
    return {};
  }
}

export async function saveSpellingResult(userId: string, exerciseId: string, errors: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const dbString = localStorage.getItem(SPELLING_PROGRESS_DB);
    const db: SpellingProgress = dbString ? JSON.parse(dbString) : {};
    
    if (!db[userId]) {
        db[userId] = {};
    }

    db[userId][exerciseId] = {
        completedAt: new Date().toISOString(),
        errors: errors,
    };

    localStorage.setItem(SPELLING_PROGRESS_DB, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save spelling result", e);
  }
}
