

'use client';

import { SpellingExercise } from '@/components/spelling-exercise';
import { useParams, useRouter } from 'next/navigation';

export default function SpellingDictationPage() {
    const params = useParams();
    const router = useRouter();
    const { exerciseId } = params as { exerciseId: string };
    
    return (
        <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
            <SpellingExercise exerciseId={exerciseId} onFinish={() => router.push('/devoirs')} />
        </main>
    )
}
