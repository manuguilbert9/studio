'use server';
/**
 * @fileOverview Un flux d'IA pour générer des phrases motivantes pour les élèves.
 *
 * - generateMotivationalPhrase - Une fonction qui retourne une phrase courte, rimée et positive.
 * - MotivationalPhraseOutput - Le type de retour de la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MotivationalPhraseOutputSchema = z.object({
  phrase: z.string().describe("Une phrase courte, positive et motivante, idéalement avec une rime, pour un élève sur le point de commencer un exercice. La phrase ne doit pas dépasser 10 mots."),
});
export type MotivationalPhraseOutput = z.infer<typeof MotivationalPhraseOutputSchema>;

const themes = [
    'les étoiles et l\'espace',
    'les super-héros',
    'les explorateurs et l\'aventure',
    'la magie et les sorciers',
    'les animaux de la jungle',
    'les sports et les champions',
    'les robots et le futur',
    'les pirates et les trésors'
];

const prompt = ai.definePrompt({
  name: 'motivationalPhrasePrompt',
  output: { schema: MotivationalPhraseOutputSchema },
  prompt: `Tu es un poète spécialisé dans la création de phrases ultra-motivantes pour des enfants de 6 à 10 ans.
Ta mission est de créer UNE SEULE phrase.

La phrase doit être :
- Très courte (moins de 10 mots).
- Positive et pleine d'énergie.
- Si possible, avec une rime simple et efficace.
- Sur le thème de : {{{theme}}}

Exemples de phrases attendues :
- "Choisis un défi et montre ton génie !"
- "Aujourd'hui, c'est toi le champion !"
- "Fais briller tes neurones, décroche la couronne !"
- "Une nouvelle mission, place à l'action !"

Ne génère qu'une seule et unique phrase.
`,
});


const motivationalPhraseFlow = ai.defineFlow(
  {
    name: 'motivationalPhraseFlow',
    outputSchema: MotivationalPhraseOutputSchema,
  },
  async () => {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const { output } = await prompt({ theme });
    return output!;
  }
);

export async function generateMotivationalPhrase(): Promise<MotivationalPhraseOutput> {
  return await motivationalPhraseFlow();
}
