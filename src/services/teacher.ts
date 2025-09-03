
'use server';

import { skills } from '@/lib/skills';
import settings from '@/data/teacher-settings.json';

interface TeacherSettings {
    currentSpellingListId?: string;
    enabledSkills?: Record<string, boolean>;
}

/**
 * Retrieves the ID of the current spelling list from the local JSON file.
 * @returns The ID of the current spelling list, or null if not set.
 */
export async function getCurrentSpellingListId(): Promise<string | null> {
    const teacherSettings = settings as TeacherSettings;
    return teacherSettings.currentSpellingListId || null;
}

/**
 * Retrieves the enabled/disabled state for all skills from the local JSON file.
 * If no settings are found, it returns a default object with all skills enabled.
 * @returns An object mapping skill slugs to a boolean.
 */
export async function getEnabledSkills(): Promise<Record<string, boolean>> {
    const teacherSettings = settings as TeacherSettings;
    const defaultSkills: Record<string, boolean> = {};
    
    skills.forEach(skill => {
        defaultSkills[skill.slug] = true; // Default to enabled
    });

    if (teacherSettings && teacherSettings.enabledSkills) {
        // Merge saved settings with defaults to ensure all skills are present
        // This is useful if a new skill is added to the app later.
        const mergedSkills = { ...defaultSkills, ...teacherSettings.enabledSkills };
        return mergedSkills;
    }
    
    // If no settings.enabledSkills, return the complete default list
    return defaultSkills;
}
