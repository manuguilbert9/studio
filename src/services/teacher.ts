
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { skills } from '@/lib/skills';

const SETTINGS_COLLECTION = 'teacher';
const SETTINGS_DOC_ID = 'settings';

interface TeacherSettings {
    currentSpellingListId?: string;
    enabledSkills?: Record<string, boolean>;
}

// Helper function to get the settings document
async function getSettingsDoc(): Promise<TeacherSettings | null> {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data() as TeacherSettings;
        }
        return null;
    } catch (error) {
        console.error("Error fetching teacher settings:", error);
        return null;
    }
}


export async function getCurrentSpellingListId(): Promise<string | null> {
    const settings = await getSettingsDoc();
    return settings?.currentSpellingListId || null;
}

export async function setCurrentSpellingListId(listId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(settingsRef, { currentSpellingListId: listId }, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Error setting current spelling list:", e);
        if (e instanceof Error) return { success: false, error: e.message };
        return { success: false, error: "An unknown error occurred." };
    }
}

export async function getEnabledSkills(): Promise<Record<string, boolean> | null> {
    const settings = await getSettingsDoc();
    return settings?.enabledSkills || null;
}

export async function setEnabledSkills(enabledSkills: Record<string, boolean>): Promise<{ success: boolean; error?: string }> {
     try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(settingsRef, { enabledSkills }, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Error setting enabled skills:", e);
        if (e instanceof Error) return { success: false, error: e.message };
        return { success: false, error: "An unknown error occurred." };
    }
}
