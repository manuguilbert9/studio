
'use server';
/**
 * @fileOverview An AI flow to generate stories for children.
 *
 * - generateStory - A function that takes emojis, length, and tone to create a story.
 * - StoryInput - The input type for the generateStory function.
 * - StoryOutput - The return type for the generateStory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StoryInputSchema = z.object({
  emojis: z.array(z.string()).optional().describe('An array of emojis to inspire the story. Up to 6.'),
  description: z.string().optional().describe('A vocal description of the story to generate.'),
  length: z.enum(['courte', 'moyenne', 'longue']).describe('The desired length of the story.'),
  tone: z.enum(['aventure', 'comique', 'effrayante']).describe('The tone of the story.'),
});
export type StoryInput = z.infer<typeof StoryInputSchema>;

const StoryOutputSchema = z.object({
  title: z.string().describe('A creative and fitting title for the story.'),
  story: z.string().describe('The generated story text.'),
  moral: z.string().describe('A short, clear moral for the story.'),
});
export type StoryOutput = z.infer<typeof StoryOutputSchema>;


const lengthInstructionMap = {
    courte: 'entre 6 et 10 phrases',
    moyenne: 'entre 10 et 20 phrases',
    longue: 'd\'environ une page A4, soit à peu près 400-500 mots',
};

const toneInstructionMap = {
    aventure: 'un ton d\'aventure, avec du suspense et de l\'action.',
    comique: 'un ton comique et humoristique, avec des situations amusantes et des personnages rigolos.',
    effrayante: 'un ton effrayant mais pas sordide. L\'histoire doit pouvoir être lue par un enfant de 12 ans, en se concentrant sur le suspense et l\'atmosphère plutôt que sur la violence ou le gore.',
}

const prompt = ai.definePrompt({
  name: 'storyPrompt',
  input: { schema: StoryInputSchema },
  output: { schema: StoryOutputSchema },
  prompt: `Tu es un conteur pour enfants, spécialisé dans l'écriture d'histoires créatives, engageantes et adaptées à un jeune public (environ 8-12 ans).

Ta mission est de rédiger une histoire originale en français.

Voici les instructions à suivre :

1.  **Inspiration** : Inspire-toi des thèmes, personnages ou objets décrits ci-dessous.
{{#if description}}
    **Idée de l'enfant :** {{{description}}}
{{else}}
    **Emojis choisis :** {{#each emojis}}{{this}} {{/each}}
{{/if}}
Ne mentionne pas les emojis ou la description directement dans le texte, utilise-les comme source d'inspiration.

2.  **Longueur** : L'histoire doit être de longueur "{{length}}", c'est-à-dire {{lookup ../lengthInstructionMap length}}.

3.  **Ton** : L'histoire doit adopter {{lookup ../toneInstructionMap tone}}.

4.  **Structure** : L'histoire doit avoir un début, un développement et une fin claire.

5.  **Morale** : À la fin de l'histoire, rédige une morale claire et simple en rapport avec les événements du récit. Ne la mélange pas avec l'histoire, mais présente-la séparément.

6.  **Titre** : Donne un titre court et accrocheur à l'histoire.

Réponds uniquement avec la structure de sortie demandée (titre, histoire, morale). N'ajoute aucun commentaire ou texte supplémentaire.`,
  // Register the maps with Handlebars so the prompt can look them up
  context: {
    lengthInstructionMap,
    toneInstructionMap,
  }
});


const storyFlow = ai.defineFlow(
  {
    name: 'storyFlow',
    inputSchema: StoryInputSchema,
    outputSchema: StoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateStory(input: StoryInput): Promise<StoryOutput> {
  return await storyFlow(input);
}
