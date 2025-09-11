
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowRight, BookOpen, BrainCircuit } from 'lucide-react';
import { getCurrentHomeworkForStudent } from '@/services/teacher';
import { getStudentById } from '@/services/students';
import { cookies } from 'next/headers';
import { getSkillBySlug } from '@/lib/skills';

// This is a React Server Component
export default async function DevoirsPage() {
  const cookieStore = cookies();
  const studentId = cookieStore.get('classemagique_student_id')?.value;

  if (!studentId) {
    return (
       <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8 bg-background">
         <div className="absolute top-8">
           <Logo />
         </div>
         <Card className="w-full max-w-lg text-center p-8">
              <CardHeader>
                  <CardTitle className="font-headline text-3xl">Veuillez vous connecter</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">
                      Vous devez être connecté pour voir vos devoirs.
                  </p>
                  <Button asChild className="mt-6" variant="outline">
                      <Link href="/">
                          <Home className="mr-2 h-4 w-4"/>
                          Retour à l'accueil
                      </Link>
                  </Button>
              </CardContent>
         </Card>
      </main>
    )
  }

  const student = await getStudentById(studentId);
  if (!student) {
    // This case should be rare if studentId is valid
    return <p>Erreur: impossible de trouver les informations de l'élève.</p>
  }
  
  const homework = await getCurrentHomeworkForStudent(student);
  const frenchSkill = homework?.francais ? getSkillBySlug(homework.francais) : null;
  const mathSkill = homework?.maths ? getSkillBySlug(homework.maths) : null;

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 bg-background">
       <div className="absolute top-8 left-8">
         <Button asChild variant="outline">
            <Link href="/">
                <Home className="mr-2 h-4 w-4"/>
                Accueil
            </Link>
          </Button>
       </div>
       <div className="text-center mb-12">
            <Logo />
            <h1 className="font-headline text-5xl mt-4">Tes devoirs</h1>
            <p className="text-muted-foreground text-xl mt-2">Voici le programme pour aujourd'hui et demain.</p>
       </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* French Homework */}
        <Card className="hover:shadow-xl hover:-translate-y-1 transition-transform">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="font-headline text-3xl">Français</CardTitle>
                <CardDescription>Ton exercice de français de la semaine.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {frenchSkill ? (
              <div className="p-4 bg-background rounded-lg text-center">
                <h3 className="font-semibold text-2xl">{frenchSkill.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{frenchSkill.description}</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucun devoir de français assigné pour le moment.</p>
            )}
          </CardContent>
           {frenchSkill && (
            <CardFooter>
              <Button asChild className="w-full text-lg py-6">
                <Link href={`/exercise/${frenchSkill.slug}`}>
                  Commencer l'exercice <ArrowRight className="ml-2"/>
                </Link>
              </Button>
            </CardFooter>
           )}
        </Card>
        
         {/* Maths Homework */}
        <Card className="hover:shadow-xl hover:-translate-y-1 transition-transform">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <BrainCircuit className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <CardTitle className="font-headline text-3xl">Mathématiques</CardTitle>
                <CardDescription>Ton exercice de maths de la semaine.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {mathSkill ? (
              <div className="p-4 bg-background rounded-lg text-center">
                <h3 className="font-semibold text-2xl">{mathSkill.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{mathSkill.description}</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucun devoir de maths assigné pour le moment.</p>
            )}
          </CardContent>
           {mathSkill && (
            <CardFooter>
              <Button asChild className="w-full text-lg py-6">
                <Link href={`/exercise/${mathSkill.slug}`}>
                  Commencer l'exercice <ArrowRight className="ml-2"/>
                </Link>
              </Button>
            </CardFooter>
           )}
        </Card>

      </div>
    </main>
  );
}
