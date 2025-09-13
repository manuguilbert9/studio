

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { skills } from '@/lib/skills';
import { getGloballyEnabledSkills } from './teacher';

export type SkillLevel = 'A' | 'B' | 'C' | 'D';

export interface ScheduleStep {
    id: string;
    text: string;
    icon: string;
}

export interface ThemeColors {
    background: string;
    primary: string;
    accent: string;
}

export interface Student {
    id: string;
    name: string;
    code: string;
    groupId?: string; // Add groupId to student model
    levels?: Record<string, SkillLevel>;
    enabledSkills?: Record<string, boolean>;
    hasCustomSchedule?: boolean;
    schedule?: ScheduleStep[];
    themeColors?: ThemeColors;
}


/**
 * Creates a new student with a specific code and default levels.
 * @param name The name of the student.
 * @param code The 4-digit code for the student.
 * @returns The newly created student object.
 */
export async function createStudent(name: string, code: string): Promise<Student> {
    
    // Set default levels for all available skills to 'B'
    const defaultLevels: Record<string, SkillLevel> = {};
    skills.forEach(skill => {
        defaultLevels[skill.slug] = 'B';
    });

    // Use the globally defined enabled skills as the default for the new student
    const defaultEnabledSkills = await getGloballyEnabledSkills();

    const docRef = await addDoc(collection(db, 'students'), {
        name: name.trim(),
        code: code,
        levels: defaultLevels,
        enabledSkills: defaultEnabledSkills,
        hasCustomSchedule: false,
        schedule: [],
    });

    return {
        id: docRef.id,
        name: name.trim(),
        code: code,
        levels: defaultLevels,
        enabledSkills: defaultEnabledSkills,
        hasCustomSchedule: false,
        schedule: [],
    };
}

/**
 * Updates a student's data.
 * @param studentId The ID of the student to update.
 * @param data The data to update (name, code, levels).
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateStudent(studentId: string, data: Partial<Omit<Student, 'id'>>): Promise<{ success: boolean; error?: string }> {
    if (!studentId) {
        return { success: false, error: 'Student ID is required.' };
    }

    try {
        const studentDocRef = doc(db, 'students', studentId);
        await updateDoc(studentDocRef, data);
        return { success: true };
    } catch (error) {
        console.error("Error updating student in Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}

/**
 * Deletes a student from the database.
 * @param studentId The ID of the student to delete.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function deleteStudent(studentId: string): Promise<{ success: boolean; error?: string }> {
    if (!studentId) {
        return { success: false, error: 'Student ID is required.' };
    }
    try {
        const studentDocRef = doc(db, 'students', studentId);
        await deleteDoc(studentDocRef);
        // Note: You might also want to delete associated scores and progress here.
        return { success: true };
    } catch (error) {
        console.error("Error deleting student from Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}


/**
 * Retrieves all students from the database.
 * @returns A promise that resolves to an array of Student objects.
 */
export async function getStudents(): Promise<Student[]> {
     try {
        const q = query(collection(db, "students"));
        const querySnapshot = await getDocs(q);
        const students: Student[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            students.push({
                id: doc.id,
                name: data.name,
                code: data.code,
                groupId: data.groupId,
                levels: data.levels || {},
                enabledSkills: data.enabledSkills,
                hasCustomSchedule: data.hasCustomSchedule || false,
                schedule: data.schedule || [],
                themeColors: data.themeColors
            });
        });
        return students.sort((a,b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error loading students from Firestore:", error);
        return [];
    }
}


/**
 * Attempts to log in a student using their name and a 4-digit code.
 * The name check is case-insensitive.
 * @param name The student's name.
 * @param code The 4-digit code.
 * @returns The student object if login is successful, otherwise null.
 */
export async function loginStudent(name: string, code: string): Promise<Student | null> {
    try {
        const studentsRef = collection(db, 'students');
        const querySnapshot = await getDocs(studentsRef);

        if (querySnapshot.empty) {
            // As a fallback, create the student if the list is empty
            return await createStudent(name, code);
        }

        for (const doc of querySnapshot.docs) {
            const studentData = doc.data();
            if (studentData.name.toLowerCase() === name.trim().toLowerCase() && studentData.code === code) {
                return {
                    id: doc.id,
                    name: studentData.name,
                    code: studentData.code,
                    groupId: studentData.groupId,
                    levels: studentData.levels || {},
                    enabledSkills: studentData.enabledSkills,
                    hasCustomSchedule: studentData.hasCustomSchedule || false,
                    schedule: studentData.schedule || [],
                    themeColors: studentData.themeColors
                };
            }
        }
        
        return null; // No matching student found
    } catch (error) {
        console.error("Error during student login:", error);
        return null;
    }
}

/**
 * Gets a specific student by their ID.
 * @param studentId The unique ID of the student.
 * @returns The student object or null if not found.
 */
export async function getStudentById(studentId: string): Promise<Student | null> {
    try {
        const docRef = doc(db, 'students', studentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name,
                code: data.code,
                groupId: data.groupId,
                levels: data.levels || {},
                enabledSkills: data.enabledSkills,
                hasCustomSchedule: data.hasCustomSchedule || false,
                schedule: data.schedule || [],
                themeColors: data.themeColors
            };
        }
        return null;
    } catch (error) {
        console.error("Error getting student by ID:", error);
        return null;
    }
}
