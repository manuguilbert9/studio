

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, orderBy, query, where, Timestamp, limit } from 'firebase/firestore';
import { skills } from '@/lib/skills';
import { startOfWeek, addDays } from 'date-fns';

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
        const now = new Date();

        const findAssignmentForWeek = async (mondayDate: Date) => {
            const mondayISO = mondayDate.toISOString().split('T')[0] + 'T12:00:00.000Z';
            const q = query(collection(db, HOMEWORK_COLLECTION), where("weekOf", "==", mondayISO), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                return {
                    listId: data.spellingListId || null,
                    skillSlugLundi: data.mathSkillSlugLundi || null,
                    skillSlugJeudi: data.mathSkillSlugJeudi || null,
                    weekOf: data.weekOf,
                };
            }
            return null;
        };

        const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 });
        const nextWeekMonday = addDays(currentWeekMonday, 7);
        
        // Use native getDay() and getHours() which use the server's local time.
        // Sunday=0, Monday=1, ..., Thursday=4
        const dayOfWeek = now.getDay(); 
        const hour = now.getHours();

        // The threshold is Thursday 11:00 AM server time.
        const isAfterThreshold = (dayOfWeek === 4 && hour >= 11) || dayOfWeek > 4 || dayOfWeek === 0;

        let targetMonday = isAfterThreshold ? nextWeekMonday : currentWeekMonday;
        let assignment = await findAssignmentForWeek(targetMonday);
        
        // If no assignment for the target week, try the other one as fallback.
        if (!assignment) {
             const fallbackMonday = isAfterThreshold ? currentWeekMonday : nextWeekMonday;
             assignment = await findAssignmentForWeek(fallbackMonday);
        }

        // If still no assignment, find the most recent one in the past.
        if (!assignment) {
            const fallbackQuery = query(
                collection(db, HOMEWORK_COLLECTION),
                where("weekOf", "<=", now.toISOString()),
                orderBy("weekOf", "desc"),
                limit(1)
            );
            const fallbackSnapshot = await getDocs(fallbackQuery);
            if (!fallbackSnapshot.empty) {
                 const data = fallbackSnapshot.docs[0].data();
                 assignment = {
                    listId: data.spellingListId || null,
                    skillSlugLundi: data.mathSkillSlugLundi || null,
                    skillSlugJeudi: data.mathSkillSlugJeudi || null,
                    weekOf: data.weekOf,
                };
            }
        }
        
        return assignment || { listId: null, skillSlugLundi: null, skillSlugJeudi: null, weekOf: null };

    } catch(e) {
         console.error("Error fetching current homework config:", e);
         return { listId: null, skillSlugLundi: null, skillSlugJeudi: null, weekOf: null };
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


