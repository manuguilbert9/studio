
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { skills } from '@/lib/skills';

const settingsDocRef = doc(db, 'teacher', 'settings');

interface TeacherSettings {
    currentSpellingListId?: string;
    enabledSkills?: Record<string, boolean>;
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
 * Saves the enabled/disabled state for all skills.
 * @param skillsState A record object mapping skill slugs to a boolean.
 */
export async function setEnabledSkills(skillsState: Record<string, boolean>): Promise<{ success: boolean; error?: string }> {
    try {
        await setDoc(settingsDocRef, { enabledSkills: skillsState }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error setting enabled skills:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Retrieves the enabled/disabled state for all skills.
 * @returns An object mapping skill slugs to a boolean. If not set, returns null.
 */
export async function getEnabledSkills(): Promise<Record<string, boolean> | null> {
    const settings = await getTeacherSettings();
    if (settings.enabledSkills) {
        // Ensure all available skills are present in the returned object, defaulting to true if missing.
        const completeSkillSet: Record<string, boolean> = {};
        skills.forEach(skill => {
            completeSkillSet[skill.slug] = settings.enabledSkills![skill.slug] ?? true;
        });
        return completeSkillSet;
    }
    return null; // This indicates no settings have been saved yet.
}
