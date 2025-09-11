
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

export interface Group {
    id: string;
    name: string;
    // We don't need to store studentIds in the group document itself,
    // as the student document will have a `groupId`.
    // This avoids data duplication.
}

/**
 * Creates a new group.
 * @param name The name of the group.
 * @returns The newly created group object.
 */
export async function createGroup(name: string): Promise<Group> {
    const docRef = await addDoc(collection(db, 'groups'), {
        name: name.trim(),
        createdAt: new Date(), // For sorting purposes
    });

    return {
        id: docRef.id,
        name: name.trim(),
    };
}

/**
 * Retrieves all groups from the database.
 * @returns A promise that resolves to an array of Group objects.
 */
export async function getGroups(): Promise<Group[]> {
     try {
        const q = query(collection(db, "groups"), orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        const groups: Group[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            groups.push({
                id: doc.id,
                name: data.name,
            });
        });
        return groups;
    } catch (error) {
        console.error("Error loading groups from Firestore:", error);
        return [];
    }
}

/**
 * Updates a group's data.
 * @param groupId The ID of the group to update.
 * @param data The data to update (name).
 * @returns A promise indicating success or failure.
 */
export async function updateGroup(groupId: string, data: Partial<Omit<Group, 'id'>>): Promise<{ success: boolean; error?: string }> {
    if (!groupId) {
        return { success: false, error: 'Group ID is required.' };
    }
    try {
        const groupDocRef = doc(db, 'groups', groupId);
        await updateDoc(groupDocRef, data);
        return { success: true };
    } catch (error) {
        console.error("Error updating group:", error);
        if (error instanceof Error) return { success: false, error: error.message };
        return { success: false, error: 'An unknown error occurred.' };
    }
}

/**
 * Deletes a group from the database.
 * Note: This does NOT un-assign students from the group. That should be handled separately.
 * @param groupId The ID of the group to delete.
 * @returns A promise indicating success or failure.
 */
export async function deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    if (!groupId) {
        return { success: false, error: 'Group ID is required.' };
    }
    try {
        const groupDocRef = doc(db, 'groups', groupId);
        await deleteDoc(groupDocRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        if (error instanceof Error) return { success: false, error: error.message };
        return { success: false, error: 'An unknown error occurred.' };
    }
}
