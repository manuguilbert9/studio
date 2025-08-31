

'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { TableauState } from './tableau.types';

// Saves the state for a specific user to Firestore.
export async function saveTableauState(userId: string, state: Omit<TableauState, 'updatedAt'>): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
        return { success: false, error: 'User ID is required.' };
    }
    try {
        const userDocRef = doc(db, 'tableaux', userId);
        const stateToSave: TableauState = {
            ...state,
            updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, stateToSave);
        return { success: true };
    } catch (error) {
        console.error("Error saving tableau state to Firestore:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}

// Loads the state for a specific user from Firestore.
export async function loadTableauState(userId: string): Promise<TableauState | null> {
    if (!userId) {
        return null;
    }
    try {
        const userDocRef = doc(db, 'tableaux', userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            const loadedState = docSnap.data() as TableauState;
            // Ensure all widget arrays exist to prevent crashes with older state files
            return {
                ...loadedState,
                textWidgets: loadedState.textWidgets || [],
                dateWidgets: loadedState.dateWidgets || [],
                timerWidgets: loadedState.timerWidgets || [],
                additionWidgets: loadedState.additionWidgets || [],
                soustractionWidgets: loadedState.soustractionWidgets || [],
                imageWidgets: loadedState.imageWidgets || [],
                drawingWidgets: loadedState.drawingWidgets || [],
            };
        } else {
            console.log("No saved state found for user in Firestore:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error loading tableau state from Firestore:", error);
        return null;
    }
}
