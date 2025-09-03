'use server';
/**
 * @fileOverview An AI flow to generate word family pairs.
 *
 * - generateWordFamilies - A function that takes a list of words and returns pairs of related words.
 * - WordFamiliesInput - The input type for the generateWordFamilies function.
 * - WordFamiliesOutput - The return type for the generateWordFamilies function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const WordFamiliesInputSchema = z.object({
  words: z.array(z.string()).describe('A list of words to find family members for.'),
});
export type WordFamiliesInput = z.infer<typeof WordFamiliesInputSchema>;

const WordFamilyPairSchema = z.object({
  original: z.string().describe('The original word from the input list.'),
  familyMember: z.string().describe('A word from the same family (e.g., a noun, verb, or adjective related to the original word).'),
});

const WordFamiliesOutputSchema = z.object({
  pairs: z.array(WordFamilyPairSchema).describe('An array of word family pairs.'),
});
export type WordFamiliesOutput = z.infer<typeof WordFamiliesOutputSchema>;


const prompt = ai.definePrompt({
  name: 'wordFamiliesPrompt',
  input: { schema: WordFamiliesInputSchema },
  output: { schema: WordFamiliesOutputSchema },
  prompt: `You are an expert French linguist specializing in etymology and word families for elementary school students.
Your task is to take a list of French words and for each word, provide another word from the same family.
The family member can be a noun, verb, adjective, or adverb that is clearly related to the original word.
Keep the family members simple and understandable for a child.

For example, if the input is ["dent", "long"], a good output would be [{"original": "dent", "familyMember": "dentiste"}, {"original": "long", "familyMember": "longueur"}].

Do not provide the same word as a family member. Ensure the family member is a different word.
Make sure every word in the input list has a corresponding pair in the output.

Input words:
{{#each words}}
- {{{this}}}
{{/each}}
`,
});


const wordFamiliesFlow = ai.defineFlow(
  {
    name: 'wordFamiliesFlow',
    inputSchema: WordFamiliesInputSchema,
    outputSchema: WordFamiliesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateWordFamilies(input: WordFamiliesInput): Promise<WordFamiliesOutput> {
  return await wordFamiliesFlow(input);
}
