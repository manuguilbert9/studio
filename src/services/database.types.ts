
import type { Student } from "./students";
import type { SpellingProgress } from "./spelling";
import type { Score } from "./scores";
import type { TableauState } from "./tableau.types";
import type { WritingEntry } from "./writing";
import type { Homework } from './homework';

// This defines the structure of the data in Firestore collections.
// It maps collection names to an object of documents, where the key is the document ID.

export interface DatabaseBackup {
    students: { [id: string]: Omit<Student, 'id'> };
    spellingProgress: { [id: string]: Omit<SpellingProgress, 'userId'> };
    scores: { [id: string]: Omit<Score, 'id'> };
    tableaux: { [id: string]: TableauState };
    writingEntries: { [id: string]: Omit<WritingEntry, 'id'> };
    teacher: { [id: string]: any }; // General purpose for teacher settings
    homework: { [id: string]: Omit<Homework, 'id'> };
}
