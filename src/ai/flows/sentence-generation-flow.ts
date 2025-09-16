
'use server';
/**
 * @fileOverview An AI flow to generate simple sentences for children.
 *
 * - generateSentence - A function that returns a simple, declarative sentence.
 * - SentenceOutput - The return type for the generateSentence function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SentenceOutputSchema = z.object({
  sentence: z.string().describe('A simple, grammatically correct, declarative sentence in French, suitable for a 6-7 year old child. The sentence must start with a capital letter and end with a period.'),
});
export type SentenceOutput = z.infer<typeof SentenceOutputSchema>;

const themes = [
    'les animaux de la ferme',
    'les jouets dans une chambre',
    'une journée à l\'école',
    'les fruits et légumes',
    'les véhicules',
    'le temps qu\'il fait',
    'les métiers',
    'les sports',
    'la famille',
    'les vacances à la mer'
];

const prompt = ai.definePrompt({
  name: 'simpleSentencePrompt',
  output: { schema: SentenceOutputSchema },
  prompt: `Tu es un expert en linguistique pour enfants de CP/CE1.
Ta mission est de générer UNE SEULE phrase simple et déclarative en français.

La phrase doit être :
- Courte (entre 3 et 6 mots).
- Facile à comprendre pour un enfant de 6-7 ans.
- Grammaticalement parfaite (sujet, verbe, complément).
- Commencer par une majuscule et se terminer par un point.
- Basée sur le thème aléatoire suivant : {{{theme}}}

Exemples de phrases attendues :
- Le chien court vite.
- Papa répare la voiture.
- Le soleil brille aujourd'hui.
- La pomme est rouge.

Ne génère qu'une seule et unique phrase.
`,
});


const sentenceGenerationFlow = ai.defineFlow(
  {
    name: 'sentenceGenerationFlow',
    outputSchema: SentenceOutputSchema,
  },
  async () => {
    // Pick a random theme for each generation
    const theme = themes[Math.floor(Math.random() * themes.length)];

    const { output } = await prompt({ theme });
    return output!;
  }
);


export async function generateSentence(): Promise<SentenceOutput> {
  return await sentenceGenerationFlow();
}

