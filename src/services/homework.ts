
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';

export interface Assignment {
  francais: string | null;
  maths: string | null;
}

export interface Homework {
  id: string; // The ID will be the ISO date of the assignment, e.g., "2024-09-16"
  assignments: Record<string, Assignment>; // Key is groupId
}

/**
 * Saves or updates homework for a specific date.
 * @param dateId The ISO date string (YYYY-MM-DD) for that day's homework.
 * @param assignments A record of assignments, keyed by groupId.
 * @returns An object indicating success or failure.
 */
export async function saveHomework(dateId: string, assignments: Record<string, Assignment>): Promise<{ success: boolean; error?: string }> {
  if (!dateId) {
    return { success: false, error: 'Date ID is required.' };
  }
  try {
    const homeworkDocRef = doc(db, 'homework', dateId);
    await setDoc(homeworkDocRef, { assignments });
    return { success: true };
  } catch (error) {
    console.error("Error saving homework to Firestore:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

/**
 * Retrieves all homework assignments from the database.
 * @returns A promise that resolves to an array of Homework objects.
 */
export async function getAllHomework(): Promise<Homework[]> {
  try {
    const q = query(collection(db, "homework"));
    const querySnapshot = await getDocs(q);
    const homeworks: Homework[] = [];
    querySnapshot.forEach((doc) => {
        homeworks.push({
            id: doc.id,
            assignments: doc.data().assignments || {},
        });
    });
    // Sort by date descending
    return homeworks.sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error("Error loading homework from Firestore:", error);
    return [];
  }
}


/**
 * Retrieves all relevant assignments for a specific group.
 * @param groupId The ID of the student's group.
 * @returns A promise that resolves to an array of assignments with their dates.
 */
export async function getHomeworkForGroup(groupId: string): Promise<{ date: string; assignment: Assignment }[]> {
    if (!groupId) return [];

    try {
        const homeworkCollectionRef = collection(db, "homework");
        const querySnapshot = await getDocs(homeworkCollectionRef);
        
        const groupAssignments: { date: string; assignment: Assignment }[] = [];

        querySnapshot.forEach((doc) => {
            const homeworkData = doc.data();
            if (homeworkData.assignments && homeworkData.assignments[groupId]) {
                groupAssignments.push({
                    date: doc.id,
                    assignment: homeworkData.assignments[groupId],
                });
            }
        });
        
        return groupAssignments;
    } catch (error) {
        console.error("Error loading homework for group from Firestore:", error);
        return [];
    }
}
