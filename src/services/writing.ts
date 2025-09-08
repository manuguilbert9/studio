

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, setDoc } from "firebase/firestore";

export interface WritingEntry {
    id: string;
    userId: string;
    text: string;
    createdAt: string; // ISO string
}

/**
 * Saves a new or updates an existing writing entry for a user for a specific day.
 * If an entry for the current day already exists, it will be overwritten.
 * @param userId The ID of the student.
 * @param text The text content of the entry.
 * @returns An object indicating success or failure.
 */
export async function saveWritingEntry(userId: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
        return { success: false, error: "User ID is required." };
    }
    try {
        // We'll use the date as the document ID to ensure one entry per day per user
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const entryId = `${userId}_${today}`;

        const entryRef = doc(db, 'writingEntries', entryId);

        const dataToSave = {
            userId: userId,
            text: text,
            createdAt: Timestamp.now()
        };

        // Use setDoc with merge to create or update the document.
        await setDoc(entryRef, dataToSave, { merge: true });

        return { success: true };

    } catch (error) {
        console.error("Error saving writing entry to Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}


/**
 * Retrieves all writing entries for a specific user, sorted by date.
 * @param userId The ID of the student.
 * @returns An array of WritingEntry objects.
 */
export async function getWritingEntriesForUser(userId: string): Promise<WritingEntry[]> {
    if (!userId) {
        return [];
    }
    try {
        const q = query(
            collection(db, "writingEntries"), 
            where("userId", "==", userId), 
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const entries: WritingEntry[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            entries.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as WritingEntry);
        });
        
        return entries;
    } catch (error) {
        console.error("Error loading writing entries from Firestore:", error);
        return [];
    }
}

/**
 * Retrieves all writing entries for all users.
 * @returns An array of WritingEntry objects.
 */
export async function getAllWritingEntries(): Promise<WritingEntry[]> {
    try {
        const q = query(
            collection(db, "writingEntries"),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const entries: WritingEntry[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            entries.push({
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as WritingEntry);
        });
        
        return entries;
    } catch (error) {
        console.error("Error loading all writing entries from Firestore:", error);
        return [];
    }
}
