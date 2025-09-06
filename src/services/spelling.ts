
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { promises as fs } from 'fs';
import path from 'path';


export interface SpellingList {
  id: string;
  title: string;
  words: string[];
  totalWords: number;
}

export interface SpellingResult {
    completedAt: string;
    errors: string[];
}

export interface SpellingProgress {
  userId: string;
  progress: Record<string, SpellingResult>;
}


async function parseSpellingFile(): Promise<SpellingList[]> {
    const lists: SpellingList[] = [];
    
    try {
        const filePath = path.join(process.cwd(), 'public', 'orthographe', 'listes_orthographe.txt');
        const fileContent: string = await fs.readFile(filePath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== ''); // Ignore empty lines

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Check if the line is a list header (e.g., "D1 – ...")
            if (/^D\d+\s*–/.test(line)) {
                const titleParts = line.split('–');
                const listId = titleParts[0].trim();
                const listTitle = titleParts.slice(1).join('–').trim();
                
                // The words are expected on the next line
                if (i + 1 < lines.length) {
                    const wordsLine = lines[i + 1].trim();
                    const words = wordsLine.split(',').map(word => word.trim()).filter(Boolean);
                    
                    lists.push({
                        id: listId,
                        title: listTitle,
                        words: words,
                        totalWords: words.length
                    });
                    // Skip the next line since we've already processed it
                    i++; 
                }
            }
        }
    } catch(error) {
        console.error("Could not read or parse spelling file:", error);
        return [];
    }

    return lists;
}


export async function getSpellingLists(): Promise<SpellingList[]> {
    return parseSpellingFile();
}

// --- Firestore Progress Functions ---

export async function getSpellingProgress(userId: string): Promise<Record<string, boolean>> {
  if (!userId) return {};
  try {
    const progressRef = doc(db, 'spellingProgress', userId);
    const docSnap = await getDoc(progressRef);
    if(docSnap.exists()){
      const data = docSnap.data();
      // Ensure data is not null and is an object before processing
      if(data && typeof data === 'object'){
        const progress: Record<string, boolean> = {};
        for(const key in data){
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                progress[key] = true;
            }
        }
        return progress;
      }
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

export async function getAllSpellingProgress(): Promise<SpellingProgress[]> {
    try {
        const spellingProgressCollectionRef = collection(db, "spellingProgress");
        const querySnapshot = await getDocs(spellingProgressCollectionRef);
        const allProgress: SpellingProgress[] = [];
        querySnapshot.forEach((doc) => {
            const rawData = doc.data();
            const processedProgress: Record<string, SpellingResult> = {};
            // Ensure rawData is not null and is an object
            if (rawData && typeof rawData === 'object') {
              for (const key in rawData) {
                  if (Object.prototype.hasOwnProperty.call(rawData, key)) {
                      const result = rawData[key];
                      if (result && result.completedAt instanceof Timestamp) {
                           processedProgress[key] = {
                              completedAt: result.completedAt.toDate().toISOString(),
                              errors: result.errors || []
                           };
                      }
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
