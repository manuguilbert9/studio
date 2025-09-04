
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, doc, deleteDoc } from "firebase/firestore"; 
import type { CalculationSettings, CurrencySettings, TimeSettings } from '@/lib/questions';

export type HomeworkSession = 'lundi' | 'jeudi';

export interface Score {
    id: string;
    userId: string;
    skill: string;
    score: number;
    createdAt: string; 
    timeSettings?: TimeSettings;
    calculationSettings?: CalculationSettings;
    currencySettings?: CurrencySettings;
    homeworkSession?: HomeworkSession; // To mark which homework was done
}

// Adds a new score document to the 'scores' collection.
export async function addScore(scoreData: Omit<Score, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    if (!scoreData.userId) {
        return { success: false, error: 'User ID is required.' };
    }
    try {
        await addDoc(collection(db, 'scores'), {
            ...scoreData,
            createdAt: Timestamp.now()
        });
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

// Checks if a student has completed a specific math homework
export async function hasDoneMathHomework(userId: string, skillSlug: string, session: HomeworkSession): Promise<boolean> {
    if (!userId || !skillSlug || !session) {
        return false;
    }
    try {
        const q = query(
            collection(db, "scores"),
            where("userId", "==", userId),
            where("skill", "==", skillSlug),
            where("homeworkSession", "==", session),
            limit(1) // We only need to know if at least one exists
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking math homework status:", error);
        return false;
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
