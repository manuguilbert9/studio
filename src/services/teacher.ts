

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { skills } from '@/lib/skills';

const SETTINGS_COLLECTION = 'teacher';
const SETTINGS_DOC_ID = 'settings';

interface TeacherSettings {
    enabledSkills?: Record<string, boolean>;
    currentSchoolYear?: string; // e.g., "2024"
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

export async function getCurrentSchoolYear(): Promise<string> {
    const settings = await getSettingsDoc();
    // Default to the current year if not set. A school year starting in 2023 ends in 2024.
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    // If it's before september, the school year is the previous one.
    const defaultYear = currentMonth < 8 ? String(currentYear - 1) : String(currentYear);
    return settings?.currentSchoolYear || defaultYear;
}

export async function setCurrentSchoolYear(year: string): Promise<{ success: boolean; error?: string }> {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(settingsRef, { currentSchoolYear: year }, { merge: true });
        return { success: true };
    } catch (e) {
        console.error("Error setting school year:", e);
        if (e instanceof Error) return { success: false, error: e.message };
        return { success: false, error: "An unknown error occurred." };
    }
}
