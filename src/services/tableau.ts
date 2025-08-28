
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface TextWidgetState {
    id: number;
    pos: Position;
    size: Size;
    text: string;
    fontSize: number;
    color: string;
    isUnderlined: boolean;
}

export interface DateWidgetState {
    id: number;
    pos: Position;
    size: Size;
    dateFormat: 'long' | 'short';
}

export interface TimerWidgetState {
    id: number;
    pos: Position;
    size: Size;
}

export interface AdditionWidgetState {
    id: number;
    pos: Position;
    size: Size;
    numOperands: number;
    numCols: number;
}

export interface TableauState {
    activeSkillSlug: string | null;
    textWidgets: TextWidgetState[];
    dateWidgets: DateWidgetState[];
    timerWidgets: TimerWidgetState[];
    additionWidgets: AdditionWidgetState[];
    updatedAt: Timestamp | null;
}

export async function saveTableauState(userId: string, state: Omit<TableauState, 'updatedAt'>): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
        return { success: false, error: 'User ID is required.' };
    }
    try {
        const stateToSave = {
            ...state,
            updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'tableauStates', userId), stateToSave);
        return { success: true };
    } catch (error) {
        console.error("Error saving tableau state:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}


export async function loadTableauState(userId: string): Promise<TableauState | null> {
    if (!userId) {
        return null;
    }
    try {
        const docRef = doc(db, 'tableauStates', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // We return the data which includes the server-side timestamp
            return docSnap.data() as TableauState;
        } else {
            console.log("No such document for user:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error loading tableau state:", error);
        return null;
    }
}
