
'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SpellingExercise } from '@/components/spelling-exercise';

export default function SpellingPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const exerciseId = typeof params.exerciseId === 'string' ? params.exerciseId : '';
    const from = searchParams.get('from');

    const handleFinish = () => {
        // Go back to the page the user came from
        if (from === 'devoirs') {
            router.push('/devoirs');
        } else {
            router.push('/');
        }
    };

    if (!exerciseId) {
        return <div className="p-8 text-center">ID d'exercice invalide.</div>
    }

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-start p-4 sm:p-8 bg-background">
             <SpellingExercise exerciseId={exerciseId} onFinish={handleFinish} />
        </main>
    );
}
