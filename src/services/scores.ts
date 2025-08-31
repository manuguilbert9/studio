
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore"; 
import type { CalculationSettings, CurrencySettings, TimeSettings } from '@/lib/questions';

export interface Score {
    id: string;
    userId: string;
    skill: string;
    score: number;
    createdAt: string; 
    calculationSettings?: CalculationSettings;
    currencySettings?: CurrencySettings;
    timeSettings?: TimeSettings;
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
        let q = query(collection(db, "scores"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        if(skillSlug){
            q = query(collection(db, "scores"), where("userId", "==", userId), where("skill", "==", skillSlug), orderBy("createdAt", "desc"));
        }
        
        const querySnapshot = await getDocs(q);
        const scores: Score[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            scores.push({
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to ISO string for consistency
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as Score);
        });
        return scores;
    } catch (error) {
        console.error("Error loading scores from Firestore:", error);
        return [];
    }
}
