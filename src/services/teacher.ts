

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { skills } from '@/lib/skills';
import { startOfWeek, addDays, getDay } from 'date-fns';
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
 * Gets the relevant homework assignment for a student based on the current date.
 * Rules:
 * - Saturday to Tuesday: Show Monday's homework.
 * - Wednesday, Thursday: Show Thursday's homework.
 * - Friday: Show nothing.
 */
export async function getCurrentHomeworkForStudent(student: Student): Promise<Assignment | null> {
    if (!student.groupId) {
        return null; // No group, no homework
    }

    const today = new Date();
    const dayOfWeek = getDay(today); // Sunday: 0, Monday: 1, ..., Saturday: 6
    
    let targetDate: Date | null = null;
    const mondayOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });

    // Days: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
    if ([6, 0, 1, 2].includes(dayOfWeek)) { // Saturday, Sunday, Monday, Tuesday
        targetDate = mondayOfThisWeek;
    } else if ([3, 4].includes(dayOfWeek)) { // Wednesday, Thursday
        targetDate = addDays(mondayOfThisWeek, 3); // Thursday
    } else { // Friday
        return null;
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
