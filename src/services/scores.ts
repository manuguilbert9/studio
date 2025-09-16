

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, doc, deleteDoc, writeBatch } from "firebase/firestore"; 
import type { CalculationSettings, CurrencySettings, TimeSettings, CalendarSettings, CountSettings, NumberLevelSettings, ReadingRaceSettings } from '@/lib/questions';

export interface CalculationState {
  [cellId: string]: {
    value: string;
    isCrossed?: boolean;
  };
}

export interface ScoreDetail {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    status: 'correct' | 'incorrect' | 'completed'; // Added 'completed' for non-binary results like reading race
    calculationState?: CalculationState;
    mistakes?: string[]; // For storing reading or spelling mistakes
    options?: string[]; // For QCM questions, to see what choices were offered
    score?: number; // For exercises that provide a per-item score (like phrase construction)
}

export interface Score {
    id: string;
    userId: string;
    skill: string;
    score: number;
    createdAt: string; 
    details?: ScoreDetail[];
    calculationState?: CalculationState; // For storing the state of the whole widget if needed
    timeSettings?: TimeSettings;
    calculationSettings?: CalculationSettings;
    currencySettings?: CurrencySettings;
    calendarSettings?: CalendarSettings;
    countSettings?: CountSettings;
    numberLevelSettings?: NumberLevelSettings;
    readingRaceSettings?: ReadingRaceSettings;
}

// Adds a new score document to the 'scores' collection.
export async function addScore(scoreData: Omit<Score, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    if (!scoreData.userId) {
        return { success: false, error: 'User ID is required.' };
    }
    try {
        const dataToSave = {
            ...scoreData,
            details: scoreData.details || [], // Ensure details is an array
            createdAt: Timestamp.now()
        };

        await addDoc(collection(db, 'scores'), dataToSave);
        return { success: true };
    } catch (error) {
        console.error("Error adding score to Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}

// Retrieves all scores for a specific user, optionally filtered by skill.
export async function getScoresForUser(userId: string, skillSlug?: string): Promise<Score[]> {
    if (!userId) {
        return [];
    }
    try {
        let q;
        if(skillSlug){
            q = query(collection(db, "scores"), where("userId", "==", userId), where("skill", "==", skillSlug), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, "scores"), where("userId", "==", userId));
        }
        
        const querySnapshot = await getDocs(q);
        const scores: Score[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Score);
        });

        // If no skillSlug was provided, sort manually as the query can't do it without an index
        if (!skillSlug) {
            scores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        
        return scores;
    } catch (error) {
        console.error("Error loading scores from Firestore:", error);
        return [];
    }
}

// Retrieves all scores for all users, for the teacher dashboard.
export async function getAllScores(): Promise<Score[]> {
    try {
        const q = query(collection(db, "scores"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const scores: Score[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Score);
        });
        
        return scores;
    } catch (error) {
        console.error("Error loading all scores from Firestore:", error);
        return [];
    }
}

// Deletes a specific score document from the 'scores' collection.
export async function deleteScore(scoreId: string): Promise<{ success: boolean; error?: string }> {
    if (!scoreId) {
        return { success: false, error: 'Score ID is required.' };
    }
    try {
        const scoreDocRef = doc(db, 'scores', scoreId);
        await deleteDoc(scoreDocRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting score from Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}


/**
 * Deletes all scores that were generated by the dummy/template question.
 */
export async function deleteDummyScores(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const DUMMY_QUESTION_TEXT = "Ceci est un exemple de question. Choisissez la bonne réponse.";
    
    try {
        const scoresRef = collection(db, "scores");
        // We need to fetch all and filter in the function, as Firestore can't query inside array fields directly.
        const querySnapshot = await getDocs(scoresRef);
        
        const batch = writeBatch(db);
        let deletedCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const details = data.details as ScoreDetail[] | undefined;
            if (details && details.some(d => d.question === DUMMY_QUESTION_TEXT)) {
                batch.delete(doc.ref);
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            await batch.commit();
        }

        return { success: true, deletedCount };
    } catch (error) {
        console.error("Error deleting dummy scores:", error);
        if (error instanceof Error) {
            return { success: false, deletedCount: 0, error: error.message };
        }
        return { success: false, deletedCount: 0, error: 'An unknown error occurred.' };
    }
}

    