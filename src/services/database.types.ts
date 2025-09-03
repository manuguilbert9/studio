
import type { Student } from "./students";
import type { SpellingProgress } from "./spelling";
import type { Score } from "./scores";
import type { TableauState } from "./tableau.types";

// This defines the structure of the data in Firestore collections.
// It maps collection names to an object of documents, where the key is the document ID.

export interface DatabaseBackup {
    students: { [id: string]: Omit<Student, 'id'> };
    spellingProgress: { [id: string]: Omit<SpellingProgress, 'userId'> };
    scores: { [id: string]: Omit<Score, 'id'> };
    tableaux: { [id: string]: TableauState };
    teacher: { [id: string]: any }; // General purpose for teacher settings
}
