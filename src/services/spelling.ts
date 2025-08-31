
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from 'firebase/firestore';

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

// Dummy data since we are not parsing the file anymore for the lists.
// The list content is now in the PDF.
const dummyLists: SpellingList[] = [
    { id: "D1", title: "Les consonnes muettes", words: ["respect", "abus", "accord", "bord", "bras", "cas", "concours", "corps", "drap", "dos", "droit", "efforts", "endroit", "esprit", "progrès", "instant", "intérêt", "loup", "mépris", "minuit", "nez", "plaisir", "propos", "refus", "repas", "repos", "retard", "souhait", "temps", "tort", "travers", "univers", "velours", "avis", "brebis", "fois", "fourmis", "souris"], totalWords: 39 },
    { id: "D2", title: "Les noms en -EAU", words: ["arbrisseau", "bandeau", "bateau", "berceau", "bureau", "cadeau", "carreau", "chameau", "chapeau", "château", "couteau", "drapeau", "morceau", "panneau", "oiseau", "peau", "plateau", "poireau", "ruisseau", "sceau", "seau", "taureau", "tombeau", "tonneau", "tuyau", "veau"], totalWords: 26 },
];

// This function now returns dummy data as the source of truth is the PDF.
// The structure is kept for the exercise logic to work.
export async function getSpellingLists(): Promise<SpellingList[]> {
    // In a real application, you might fetch this from a database or a proper JSON file.
    return Promise.resolve(dummyLists);
}

// --- Firestore Progress Functions ---

export async function getSpellingProgress(userId: string): Promise<Record<string, boolean>> {
  if (!userId) return {};
  try {
    const progressRef = doc(db, 'spellingProgress', userId);
    const docSnap = await getDoc(progressRef);
    if(docSnap.exists()){
      const data = docSnap.data();
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
