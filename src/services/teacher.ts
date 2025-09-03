
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const settingsDocRef = doc(db, 'teacher', 'settings');

interface TeacherSettings {
    currentSpellingListId?: string;
    // enabledSkills is removed for now to simplify focus on student management
}

/**
 * Retrieves all teacher settings from Firestore.
 * @returns The settings object, or a default object if not set.
 */
async function getTeacherSettings(): Promise<TeacherSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as TeacherSettings;
        }
        return {};
    } catch (error) {
        console.error("Error getting teacher settings:", error);
        return {};
    }
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
    const settings = await getTeacherSettings();
    return settings.currentSpellingListId || null;
}
