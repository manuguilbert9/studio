
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const settingsDocRef = doc(db, 'teacher', 'settings');

interface TeacherSettings {
    currentSpellingListId?: string;
}

/**
 * Saves the ID of the current spelling list.
 * @param listId The ID of the spelling list to set as current (e.g., "D1").
 */
export async function setCurrentSpellingList(listId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await setDoc(settingsDocRef, { currentSpellingListId: listId }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error setting current spelling list:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Retrieves the ID of the current spelling list.
 * @returns The ID of the current spelling list, or null if not set.
 */
export async function getCurrentSpellingListId(): Promise<string | null> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const settings = docSnap.data() as TeacherSettings;
            return settings.currentSpellingListId || null;
        }
        return null;
    } catch (error) {
        console.error("Error getting current spelling list:", error);
        return null;
    }
}
