
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';

export interface Assignment {
  francais: string | null;
  maths: string | null;
}

export interface Homework {
  id: string; // The ID will be the ISO date of the Monday of the week, e.g., "2024-09-16"
  assignments: Record<string, Assignment>; // Key is groupId
}

/**
 * Saves or updates homework for a specific week.
 * @param weekId The ISO date string (YYYY-MM-DD) of the Monday for that week.
 * @param assignments A record of assignments, keyed by groupId.
 * @returns An object indicating success or failure.
 */
export async function saveHomework(weekId: string, assignments: Record<string, Assignment>): Promise<{ success: boolean; error?: string }> {
  if (!weekId) {
    return { success: false, error: 'Week ID is required.' };
  }
  try {
    const homeworkDocRef = doc(db, 'homework', weekId);
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
    // Sort by week date descending
    return homeworks.sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    console.error("Error loading homework from Firestore:", error);
    return [];
  }
}
