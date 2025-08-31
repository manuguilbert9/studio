
'use server';

import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from 'firebase/firestore';


export interface SpellingList {
  id: string; // e.g., "D1"
  title: string; // e.g., "Les consonnes muettes en fin de mot"
  words: string[];
}

export interface SpellingResult {
    completedAt: string; // Changed from Timestamp to string for serialization
    errors: string[];
}

export interface SpellingProgress {
  userId: string; // This is now the student's unique ID
  progress: Record<string, SpellingResult>;
}

const spellingFileCache: { lists: SpellingList[] | null } = {
  lists: null,
};

// This function reads and parses the spelling list file.
// It uses a simple cache to avoid reading the file on every request in dev mode.
export async function getSpellingLists(): Promise<SpellingList[]> {
  if (process.env.NODE_ENV === 'production' && spellingFileCache.lists) {
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
      const titleMatch = line.match(/^(D\d+)\s*–\s*(.*)$/);
      if (titleMatch) {
        if (currentList) {
          lists.push(currentList);
        }
        const [, id, title] = titleMatch;
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
      const data = docSnap.data();
      // The data is a map of { exerciseId: { completedAt, errors } }
      // We just need the keys to know which are completed.
      return Object.keys(data).reduce((acc, key) => {
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

export async function saveSpellingResult(userId: string, exerciseId: string, errors: string[]): Promise<{success: boolean, error?: string}> {
  if (!userId) return { success: false, error: "User ID is required."};
  try {
    const userProgressRef = doc(db, 'spellingProgress', userId);
    
    // We use setDoc with merge:true to create the doc if it doesn't exist,
    // or update a specific field (exerciseId) if it does.
    // The key is computed property name.
    await setDoc(userProgressRef, {
      [exerciseId.toLowerCase()]: {
        completedAt: Timestamp.now(),
        errors: errors,
      }
    }, { merge: true });

    return { success: true };

  } catch (e) {
    console.error("Failed to save spelling result to Firestore", e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: "An unknown error occurred."};
  }
}

// Retrieves all spelling progress for all users, for the teacher dashboard.
export async function getAllSpellingProgress(): Promise<SpellingProgress[]> {
    try {
        const spellingProgressCollectionRef = collection(db, "spellingProgress");
        const querySnapshot = await getDocs(spellingProgressCollectionRef);
        const allProgress: SpellingProgress[] = [];
        querySnapshot.forEach((doc) => {
            const rawData = doc.data();
            const processedProgress: Record<string, SpellingResult> = {};
            
            // Process each exercise in the document to convert Timestamp
            for (const key in rawData) {
                if (Object.prototype.hasOwnProperty.call(rawData, key)) {
                    const result = rawData[key];
                    if (result.completedAt instanceof Timestamp) {
                         processedProgress[key] = {
                            completedAt: result.completedAt.toDate().toISOString(),
                            errors: result.errors
                         };
                    }
                }
            }

            allProgress.push({
                userId: doc.id,
                progress: processedProgress
            });
        });
        return allProgress;
    } catch (error) {
        console.error("Error loading all spelling progress from Firestore:", error);
        return [];
    }
}
