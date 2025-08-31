
'use server';

import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';


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

// --- Firestore Progress Functions ---

export async function getSpellingProgress(userId: string): Promise<Record<string, boolean>> {
  if (!userId) return {};
  try {
    const progressRef = doc(db, 'spellingProgress', userId);
    const docSnap = await getDoc(progressRef);
    if(docSnap.exists()){
      // The data is a map of { exerciseId: { completedAt, errors } }
      // We just need the keys to know which are completed.
      return Object.keys(docSnap.data()).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    return {};
  } catch (e) {
    console.error("Failed to get spelling progress from Firestore", e);
    return {};
  }
}

export async function saveSpellingResult(userId: string, exerciseId: string, errors: string[]) {
  if (!userId) return;
  try {
    const userProgressRef = doc(db, 'spellingProgress', userId);
    
    // We use setDoc with merge:true to create the doc if it doesn't exist,
    // or update a specific field (exerciseId) if it does.
    await setDoc(userProgressRef, {
      [exerciseId]: {
        completedAt: new Date().toISOString(),
        errors: errors,
      }
    }, { merge: true });

  } catch (e) {
    console.error("Failed to save spelling result to Firestore", e);
  }
}
