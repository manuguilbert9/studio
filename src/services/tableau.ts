
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { TableauState } from './tableau.types';

// Defines the path to our local JSON database file.
const dataPath = path.join(process.cwd(), 'src/data');
const stateFilePath = path.join(dataPath, 'tableau-states.json');

// This type represents the structure of our entire JSON database file.
// It's a dictionary mapping userIds (strings) to their TableauState.
type StateDatabase = Record<string, TableauState>;

// Ensures the data directory exists. If not, it creates it.
async function ensureDirectoryExists() {
    try {
        await fs.access(dataPath);
    } catch {
        await fs.mkdir(dataPath, { recursive: true });
    }
}

// Reads the entire state database from the JSON file.
// If the file doesn't exist, it returns an empty object.
async function readDatabase(): Promise<StateDatabase> {
    try {
        await ensureDirectoryExists();
        const fileContent = await fs.readFile(stateFilePath, 'utf-8');
        return JSON.parse(fileContent) as StateDatabase;
    } catch (error) {
        // If the file doesn't exist (ENOENT) or is empty, return a blank state.
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return {};
        }
        console.error("Error reading state database, returning empty state:", error);
        return {};
    }
}

// Writes the entire state database to the JSON file.
async function writeDatabase(data: StateDatabase): Promise<void> {
    await ensureDirectoryExists();
    await fs.writeFile(stateFilePath, JSON.stringify(data, null, 2), 'utf-8');
}


// Saves the state for a specific user.
export async function saveTableauState(userId: string, state: Omit<TableauState, 'updatedAt'>): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
        return { success: false, error: 'User ID is required.' };
    }
    try {
        const db = await readDatabase();
        db[userId] = {
            ...state,
            updatedAt: new Date().toISOString(), // Use ISO string for JSON compatibility
        };
        await writeDatabase(db);
        return { success: true };
    } catch (error) {
        console.error("Error saving tableau state:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred.' };
    }
}

// Loads the state for a specific user.
export async function loadTableauState(userId: string): Promise<TableauState | null> {
    if (!userId) {
        return null;
    }
    try {
        const db = await readDatabase();
        const userState = db[userId];

        if (userState) {
            // Ensure all widget arrays exist to prevent crashes with older state files
            return {
                ...userState,
                textWidgets: userState.textWidgets || [],
                dateWidgets: userState.dateWidgets || [],
                timerWidgets: userState.timerWidgets || [],
                additionWidgets: userState.additionWidgets || [],
                imageWidgets: userState.imageWidgets || [],
            };
        } else {
            console.log("No saved state found for user:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error loading tableau state:", error);
        return null;
    }
}

    