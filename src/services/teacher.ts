
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

/**
 * Saves the list of enabled skill slugs for the "En classe" mode.
 * @param skills An array of skill slugs (e.g., ['reading', 'calculation']).
 */
export async function setEnabledSkills(skills: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        await setDoc(settingsDocRef, { enabledSkills: skills }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error setting enabled skills:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Retrieves the list of enabled skill slugs.
 * @returns An array of skill slugs, or null if no setting is found (implying all are enabled).
 */
export async function getEnabledSkills(): Promise<string[] | null> {
    const settings = await getTeacherSettings();
    // If the setting exists, return it. If it's undefined, return null.
    return 'enabledSkills' in settings ? settings.enabledSkills! : null;
}
