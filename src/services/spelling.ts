
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs, addDoc } from 'firebase/firestore';
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

export async function saveSpellingResult(userId: string, exerciseId: string, errors: string[]): Promise<{success: boolean, error?: string}> {
  if (!userId) return { success: false, error: "User ID is required."};
  // This function might become obsolete if spelling is only done via homework system
  // For now, it saves to a `scores` collection for general practice.
  try {
    const score = ((exerciseId.split('-')[1] === 'lundi' ? 10 : 10) - errors.length) / (exerciseId.split('-')[1] === 'lundi' ? 10 : 10) * 100;
    await addDoc(collection(db, 'scores'), {
      userId: userId,
      skill: 'orthographe',
      score: score,
      createdAt: Timestamp.now(),
      details: [
        {
          question: `Dictée ${exerciseId}`,
          userAnswer: `Erreurs: ${errors.length}`,
          correctAnswer: '0 erreurs',
          status: errors.length === 0 ? 'correct' : 'incorrect',
          mistakes: errors,
        }
      ]
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to save spelling result to Firestore", e);
    if (e instanceof Error) {
        return { success: false, error: e.message };
    }
    return { success: false, error: "An unknown error occurred."};
  }
}
