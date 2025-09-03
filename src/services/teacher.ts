
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

const settingsDocRef = doc(db, 'teacher', 'settings');

interface TeacherSettings {
    currentSpellingListId?: string;
    enabledSkills?: string[];
}

/**
 * Retrieves all teacher settings from Firestore.
 * If the document doesn't exist, it returns an empty object.
 * @returns The settings object.
 */
async function getTeacherSettings(): Promise<TeacherSettings> {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as TeacherSettings;
        }
        return {}; // Return empty object if no settings doc exists
    } catch (error) {
        console.error("Error getting teacher settings:", error);
        return {}; // Return empty object on error
    }
}

/**
 * Saves the ID of the current spelling list.
 * @param listId The ID of the spelling list to set as current (e.g., "D1").
 */
export async function setCurrentSpellingList(listId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Using merge: true will create the document if it doesn't exist.
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

/**
 * Saves the list of enabled skill slugs for the "En classe" mode.
 * @param skills An array of skill slugs (e.g., ['reading', 'calculation']).
 */
export async function setEnabledSkills(skills: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        // Using merge: true will create the document if it doesn't exist and update only the specified field.
        await setDoc(settingsDocRef, { enabledSkills: skills }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error setting enabled skills:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Retrieves the list of enabled skill slugs.
 * @returns An array of skill slugs. If the setting has never been saved, returns null to indicate "all enabled by default".
 */
export async function getEnabledSkills(): Promise<string[] | null> {
    const settings = await getTeacherSettings();
    // If enabledSkills is not in the document, it's undefined. We return null in that case.
    if (typeof settings.enabledSkills === 'undefined') {
        return null;
    }
    return settings.enabledSkills;
}
