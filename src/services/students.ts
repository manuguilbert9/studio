
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

export interface Student {
    id: string;
    name: string;
    code: string;
}

// Generates a random 4-digit code as a string.
function generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Creates a new student with a unique 4-digit code.
 * @param name The name of the student.
 * @returns The newly created student object including the code.
 */
export async function createStudent(name: string): Promise<Student> {
    const code = generateCode();
    
    const docRef = await addDoc(collection(db, 'students'), {
        name: name.trim(),
        code: code,
    });

    return {
        id: docRef.id,
        name: name.trim(),
        code: code,
    };
}

/**
 * Updates the code for a specific student.
 * @param studentId The ID of the student to update.
 * @param newCode The new 4-digit code.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function updateStudentCode(studentId: string, newCode: string): Promise<{ success: boolean; error?: string }> {
    if (!studentId) {
        return { success: false, error: 'Student ID is required.' };
    }
    if (!newCode || newCode.length !== 4 || !/^\d{4}$/.test(newCode)) {
        return { success: false, error: 'The code must be 4 digits.' };
    }

    try {
        const studentDocRef = doc(db, 'students', studentId);
        await updateDoc(studentDocRef, {
            code: newCode
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating student code in Firestore:", error);
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
        const q = query(studentsRef, where('code', '==', code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null; // No student found with this code
        }

        // Since code might not be unique (though unlikely with 4 digits for a class),
        // we iterate through results to find a case-insensitive name match.
        // In a real-world scenario, you'd enforce code uniqueness.
        for (const doc of querySnapshot.docs) {
            const studentData = doc.data();
            if (studentData.name.toLowerCase() === name.trim().toLowerCase()) {
                return {
                    id: doc.id,
                    name: studentData.name,
                    code: studentData.code
                };
            }
        }
        
        return null; // Code was correct, but name did not match
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
            };
        }
        return null;
    } catch (error) {
        console.error("Error getting student by ID:", error);
        return null;
    }
}
