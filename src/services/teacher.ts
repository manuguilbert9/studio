

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { skills } from '@/lib/skills';
import { startOfWeek, addDays, getDay, startOfDay } from 'date-fns';
import type { Student } from './students';
import type { Homework, Assignment } from './homework';

const SETTINGS_COLLECTION = 'teacher';
const HOMEWORK_COLLECTION = 'homework';
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

/**
 * Gets the relevant homework assignment for a student based on the current date and time.
 * Rules:
 * - From Thursday 17:00, show homework for the upcoming Monday.
 * - From Monday 17:00, show homework for the upcoming Thursday.
 */
export async function getCurrentHomeworkForStudent(student: Student): Promise<Assignment | null> {
    if (!student.groupId) {
        return null; // No group, no homework
    }

    const now = new Date();
    const day = getDay(now); // Sunday: 0, Monday: 1, ..., Saturday: 6
    const hour = now.getHours();

    let targetDate: Date | null = null;
    let daysToAdd = 0;

    // From Monday 5 PM to Thursday 5 PM, we target Thursday
    if ((day === 1 && hour >= 17) || day === 2 || day === 3 || (day === 4 && hour < 17)) {
        daysToAdd = (4 - day + 7) % 7;
        targetDate = addDays(startOfDay(now), daysToAdd);
    }
    // From Thursday 5 PM to Monday 5 PM, we target Monday
    else {
        daysToAdd = (1 - day + 7) % 7;
        targetDate = addDays(startOfDay(now), daysToAdd);
    }


    if (!targetDate) return null;

    const targetDateId = targetDate.toISOString().split('T')[0];

    try {
        const homeworkDocRef = doc(db, HOMEWORK_COLLECTION, targetDateId);
        const docSnap = await getDoc(homeworkDocRef);

        if (docSnap.exists()) {
            const homeworkData = docSnap.data() as Omit<Homework, 'id'>;
            return homeworkData.assignments[student.groupId] || null;
        }
        
        return null;
    } catch (error) {
        console.error("Error getting homework for student:", error);
        return null;
    }
}
