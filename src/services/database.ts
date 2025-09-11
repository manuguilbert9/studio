
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import type { DatabaseBackup } from './database.types';

const collectionsToBackup: (keyof DatabaseBackup)[] = ['students', 'scores', 'tableaux', 'teacher', 'writingEntries', 'homework', 'homeworkResults'];

/**
 * Exports all data from the specified Firestore collections.
 */
export async function exportAllData(): Promise<DatabaseBackup> {
    const backup: Partial<DatabaseBackup> = {};

    for (const collectionName of collectionsToBackup) {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const collectionData: { [key: string]: any } = {};
            querySnapshot.forEach((docSnap) => {
                collectionData[docSnap.id] = docSnap.data();
            });
            backup[collectionName] = collectionData;
        } catch (error) {
            console.error(`Error backing up collection ${collectionName}:`, error);
            // In case of an error in one collection, we add an empty object.
            backup[collectionName] = {};
        }
    }
    
    return backup as DatabaseBackup;
}


/**
 * Imports data from a JSON object, overwriting existing collections.
 * This is a destructive operation.
 */
export async function importAllData(data: DatabaseBackup): Promise<{ success: boolean; error?: string }> {
    if (!data) {
        return { success: false, error: "No data provided to import." };
    }
    
    const batch = writeBatch(db);

    try {
        // Step 1: Delete all documents from the collections
        for (const collectionName of collectionsToBackup) {
            const querySnapshot = await getDocs(collection(db, collectionName));
            querySnapshot.forEach((docSnap) => {
                batch.delete(docSnap.ref);
            });
        }
        
        // Step 2: Add all new documents from the backup
        for (const collectionName of collectionsToBackup) {
            const collectionData = data[collectionName];
            if (collectionData) {
                for (const docId in collectionData) {
                    const docRef = doc(db, collectionName, docId);
                    batch.set(docRef, collectionData[docId]);
                }
            }
        }
        
        // Step 3: Commit the batch
        await batch.commit();
        
        return { success: true };
    } catch (error) {
        console.error("Error during data import:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred during import.' };
    }
}
