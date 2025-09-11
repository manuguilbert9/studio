

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, orderBy, query, where, Timestamp, limit } from 'firebase/firestore';
import { skills } from '@/lib/skills';
import { startOfWeek, addDays, endOfDay } from 'date-fns';

const SETTINGS_COLLECTION = 'teacher';
const HOMEWORK_COLLECTION = 'homework';
const SETTINGS_DOC_ID = 'settings';


// --- New Date-Based Homework System ---

export interface HomeworkAssignment {
    id: string;
    weekOf: string; // ISO string for the Monday of that week
    spellingListId: string | null;
    mathSkillSlugLundi: string | null;
    mathSkillSlugJeudi: string | null;
}

/**
 * Adds a new dated homework assignment.
 */
export async function addHomeworkAssignment(assignment: Omit<HomeworkAssignment, 'id'>): Promise<{ success: boolean; error?: string }> {
    try {
        await addDoc(collection(db, HOMEWORK_COLLECTION), assignment);
        return { success: true };
    } catch (e) {
        console.error("Error adding homework assignment:", e);
        if (e instanceof Error) return { success: false, error: e.message };
        return { success: false, error: "An unknown error occurred." };
    }
}

/**
 * Retrieves all homework assignments, sorted by date descending.
 */
export async function getHomeworkAssignments(): Promise<HomeworkAssignment[]> {
    try {
        const q = query(collection(db, HOMEWORK_COLLECTION), orderBy("weekOf", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as HomeworkAssignment));
    } catch (error) {
        console.error("Error fetching homework assignments:", error);
        return [];
    }
}

/**
 * Deletes a homework assignment.
 * @param id The ID of the homework assignment to delete.
 */
export async function deleteHomeworkAssignment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, HOMEWORK_COLLECTION, id));
        return { success: true };
    } catch (e) {
        console.error("Error deleting homework assignment:", e);
        if (e instanceof Error) return { success: false, error: e.message };
        return { success: false, error: "An unknown error occurred." };
    }
}


// This function now finds the homework for the current week.
export async function getCurrentHomeworkConfig(): Promise<{ listId: string | null, skillSlugLundi: string | null, skillSlugJeudi: string | null, weekOf: string | null }> {
    try {
        const allAssignments = await getHomeworkAssignments();
        if (allAssignments.length === 0) {
            return { listId: null, skillSlugLundi: null, skillSlugJeudi: null, weekOf: null };
        }

        const now = new Date();
        const currentUTCDay = now.getUTCDay(); // Sunday = 0, Monday = 1, etc.
        const isAfterCutoff = currentUTCDay >= 4 || currentUTCDay === 0; // Thursday, Friday, Saturday, Sunday

        let currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 }); // Get Monday of the current week (locale-dependent, but server is UTC)
        currentWeekMonday.setUTCHours(12, 0, 0, 0); // Normalize to noon UTC to avoid timezone issues.

        let targetMonday: Date;
        if (isAfterCutoff) {
            targetMonday = addDays(currentWeekMonday, 7); // Next week's Monday
        } else {
            targetMonday = currentWeekMonday; // This week's Monday
        }
        
        const targetMondayString = targetMonday.toISOString().split('T')[0];

        // Find the assignment that matches the target Monday
        const targetAssignment = allAssignments.find(assignment => {
            return assignment.weekOf.startsWith(targetMondayString);
        });

        if (targetAssignment) {
            return {
                listId: targetAssignment.spellingListId || null,
                skillSlugLundi: targetAssignment.mathSkillSlugLundi || null,
                skillSlugJeudi: targetAssignment.mathSkillSlugJeudi || null,
                weekOf: targetAssignment.weekOf,
            };
        }
        
        // If no specific assignment is found for the target week, return nothing.
        return { listId: null, skillSlugLundi: null, skillSlugJeudi: null, weekOf: targetMonday.toISOString() };

    } catch (e) {
        console.error("Error fetching current homework config:", e);
        const now = new Date();
        const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 });
        return { listId: null, skillSlugLundi: null, skillSlugJeudi: null, weekOf: currentWeekMonday.toISOString() };
    }
}


// --- General Teacher Settings (Legacy and Other) ---

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




    
