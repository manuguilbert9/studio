

'use client';

import { KeyboardCopyExercise } from '@/components/keyboard-copy-exercise';

export default function SpellingCopyPage() {
    return (
        <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
            <KeyboardCopyExercise isHomework={true} />
        </main>
    )
}
