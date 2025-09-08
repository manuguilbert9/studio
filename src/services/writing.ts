

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";

export interface WritingEntry {
    id: string;
    userId: string;
    text: string;
    createdAt: string; // ISO string
}

/**
 * Saves a new writing entry for a user.
 * @param userId The ID of the student.
 * @param text The text content of the entry.
 * @returns An object indicating success or failure.
 */
export async function saveWritingEntry(userId: string, text: string): Promise<{ success: boolean; error?: string, entryId?: string }> {
    if (!userId) {
        return { success: false, error: "User ID is required." };
    }
    try {
        const dataToSave = {
            userId: userId,
            text: text,
            createdAt: Timestamp.now()
        };

        // Firestore will generate a unique ID for each entry.
        const docRef = await addDoc(collection(db, 'writingEntries'), dataToSave);

        return { success: true, entryId: docRef.id };

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
            where("userId", "==", userId)
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
        
        // Sort entries by date descending after fetching
        return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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


/**
 * Deletes a specific writing entry.
 * @param entryId The ID of the writing entry to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteWritingEntry(entryId: string): Promise<{ success: boolean, error?: string }> {
    if (!entryId) {
        return { success: false, error: "Entry ID is required." };
    }
    try {
        const entryRef = doc(db, 'writingEntries', entryId);
        await deleteDoc(entryRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting writing entry from Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred while deleting the entry.' };
    }
}
