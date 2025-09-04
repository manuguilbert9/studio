
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { skills } from '@/lib/skills';

const SETTINGS_COLLECTION = 'teacher';
const SETTINGS_DOC_ID = 'settings';

interface TeacherSettings {
    currentSpellingListId?: string;
    currentMathSkillSlug?: string;
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


export async function getCurrentHomeworkConfig(): Promise<{ listId: string | null, skillSlug: string | null }> {
    const settings = await getSettingsDoc();
    return {
        listId: settings?.currentSpellingListId || null,
        skillSlug: settings?.currentMathSkillSlug || null
    };
}


export async function setCurrentHomeworkConfig(listId: string | null, skillSlug: string | null): Promise<{ success: boolean; error?: string }> {
     try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(settingsRef, { 
            currentSpellingListId: listId,
            currentMathSkillSlug: skillSlug 
        }, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Error setting current homework config:", e);
        if (e instanceof Error) return { success: false, error: e.message };
        return { success: false, error: "An unknown error occurred." };
    }
}


export async function getGloballyEnabledSkills(): Promise<Record<string, boolean>> {
    const settings = await getSettingsDoc();
    
    // If settings or enabledSkills are not defined, create a default where all skills are true
    if (!settings || !settings.enabledSkills) {
        const allEnabled: Record<string, boolean> = {};
        skills.forEach(skill => {
            allEnabled[skill.slug] = true;
        });
        return allEnabled;
    }
    
    return settings.enabledSkills;
}

export async function setGloballyEnabledSkills(enabledSkills: Record<string, boolean>): Promise<{ success: boolean; error?: string }> {
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
