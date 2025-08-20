'use server';
/**
 * @fileOverview A flow for syllabifying text using an AI model.
 * - syllabifyText - A function that takes a string of text and returns an HTML string with syllables wrapped in spans.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generate } from 'genkit/generate';

const SyllabifyInputSchema = z.string();
export type SyllabifyInput = z.infer<typeof SyllabifyInputSchema>;

const SyllabifyOutputSchema = z.string().describe("The HTML-formatted text with syllables wrapped in spans.");
export type SyllabifyOutput = z.infer<typeof SyllabifyOutputSchema>;

export async function syllabifyText(text: SyllabifyInput): Promise<SyllabifyOutput> {
  return syllabifyTextFlow(text);
}

const syllabifyPrompt = ai.definePrompt({
  name: 'syllabifyPrompt',
  input: { schema: SyllabifyInputSchema },
  output: { schema: SyllabifyOutputSchema },
  prompt: `You are a linguistic expert specializing in French phonology and orthography. 
  Your task is to segment the given text into syllables. 
  For each word, wrap each syllable in a <span> tag. 
  Alternate the class of the <span> tag between 'syllable-a' and 'syllable-b' for each syllable within a single word. 
  For example, the word 'syllabe' should become "<span class='syllable-a'>syl</span><span class='syllable-b'>la</span><span class='syllable-a'>be</span>". 
  
  Preserve the original spacing between words. Do not add any extra formatting or explanation. Only return the HTML-formatted text.

  Text to process:
  {{{prompt}}}
  `,
   config: {
    // Lower temperature for more deterministic, rule-based output
    temperature: 0.1,
  },
});

const syllabifyTextFlow = ai.defineFlow(
  {
    name: 'syllabifyTextFlow',
    inputSchema: SyllabifyInputSchema,
    outputSchema: SyllabifyOutputSchema,
  },
  async (text) => {
    if (!text) {
      return '';
    }
    const { output } = await syllabifyPrompt(text);
    // The output can be null, so we provide a fallback.
    return output ?? text;
  }
);