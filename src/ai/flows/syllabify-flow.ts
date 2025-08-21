'use server';
/**
 * @fileOverview Flow to syllabify a word using the Wordnik API.
 *
 * - syllabifyWord - A function that takes a word and returns its syllables.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetch } from 'undici';

const SyllabifyInputSchema = z.object({
  word: z.string().describe('The word to syllabify.'),
});
export type SyllabifyInput = z.infer<typeof SyllabifyInputSchema>;

const SyllablePartSchema = z.object({
    text: z.string(),
    seq: z.number(),
    type: z.string().optional(),
});

const SyllabifyOutputSchema = z.array(SyllablePartSchema);
export type SyllabifyOutput = z.infer<typeof SyllabifyOutputSchema>;

// This flow is defined but not used with a prompt. It directly calls an external API.
const syllabifyWordFlow = ai.defineFlow(
  {
    name: 'syllabifyWordFlow',
    inputSchema: SyllabifyInputSchema,
    outputSchema: SyllabifyOutputSchema,
  },
  async ({ word }) => {
    const apiKey = process.env.WORDNIK_API_KEY;
    if (!apiKey) {
      throw new Error('WORDNIK_API_KEY is not defined in the environment.');
    }

    // Clean the word of punctuation for the API call
    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    if (!cleanedWord) {
        return [{ text: word, seq: 0 }];
    }

    const url = `https://api.wordnik.com/v4/word.json/${encodeURIComponent(cleanedWord)}/hyphenation?useCanonical=false&limit=1&api_key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // If the API fails (e.g., word not found), return the original word as a single syllable
        console.error(`Wordnik API failed for "${cleanedWord}": ${response.statusText}`);
        return [{ text: word, seq: 0 }];
      }
      const data = await response.json() as SyllabifyOutput;
      // If the API returns an empty array, it means the word is a single syllable.
      if (!data || data.length === 0) {
        return [{ text: word, seq: 0 }];
      }
      return data;
    } catch (error) {
      console.error('Error calling Wordnik API:', error);
      // On error, return the original word as a fallback.
      return [{ text: word, seq: 0 }];
    }
  }
);


export async function syllabifyWord(
  input: SyllabifyInput
): Promise<SyllabifyOutput> {
  return await syllabifyWordFlow(input);
}
