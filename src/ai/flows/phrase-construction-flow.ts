
'use server';
/**
 * @fileOverview AI flows for the Phrase Construction exercise.
 *
 * - generatePhraseWords: Generates a set of words based on a difficulty level.
 * - validateConstructedPhrase: Validates a user-constructed phrase against given words and grammatical rules.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Flow for generating words
// ===================================

export const PhraseWordsInputSchema = z.object({
  level: z.enum(['B', 'C', 'D']).describe('The difficulty level (B: CP, C: CE1/CE2, D: CM1/CM2).'),
});
export type PhraseWordsInput = z.infer<typeof PhraseWordsInputSchema>;

export const PhraseWordsOutputSchema = z.object({
  words: z.array(z.string()).describe('An array of words to be used to construct a sentence.'),
});
export type PhraseWordsOutput = z.infer<typeof PhraseWordsOutputSchema>;

const levelInstructions = {
    B: "Génère 3 mots simples (sujet, verbe au présent, adverbe ou adjectif). Le vocabulaire doit être très concret et facile. La phrase à former doit être évidente. Exemples : 'Camille dort longtemps', 'Le chat court vite'.",
    C: "Génère 4 mots (sujet, verbe, complément, adjectif). Le verbe peut être au présent ou au futur simple. Le vocabulaire peut être un peu plus abstrait. La phrase à former doit être simple. Exemples: 'Achille boira du café chaud', 'Le lion mange une grosse gazelle'.",
    D: "Génère 4 ou 5 mots, incluant potentiellement des mots de liaison ou des pronoms. Le verbe peut être au passé composé ou à l'imparfait. Le vocabulaire est plus avancé, la phrase à construire peut demander un peu de réflexion sur la syntaxe. Exemples : 'Le cheval galopait dans la prairie verte', 'Hier, nous avons mangé une délicieuse tarte'.",
};

const generateWordsPrompt = ai.definePrompt({
  name: 'generatePhraseWordsPrompt',
  input: { schema: PhraseWordsInputSchema },
  output: { schema: PhraseWordsOutputSchema },
  prompt: `Tu es un assistant pédagogique pour des élèves de primaire. Ta tâche est de générer une liste de mots pour un exercice de construction de phrase.

Niveau de difficulté : {{level}}
Instructions pour ce niveau : {{lookup ../levelInstructions level}}

Ne génère qu'une seule liste de mots. Ne répète pas les exemples. Varie les sujets et les verbes.
Assure-toi que les verbes sont à l'infinitif ou sous une forme qui nécessite une conjugaison par l'élève.
`,
  context: { levelInstructions },
});

const generatePhraseWordsFlow = ai.defineFlow(
  {
    name: 'generatePhraseWordsFlow',
    inputSchema: PhraseWordsInputSchema,
    outputSchema: PhraseWordsOutputSchema,
  },
  async (input) => {
    const { output } = await generateWordsPrompt(input);
    return output!;
  }
);

export async function generatePhraseWords(input: PhraseWordsInput): Promise<PhraseWordsOutput> {
  return generatePhraseWordsFlow(input);
}


// 2. Flow for validating the phrase
// ===================================

export const ValidatePhraseInputSchema = z.object({
  providedWords: z.array(z.string()).describe('The list of words that were given to the student.'),
  userSentence: z.string().describe("The sentence constructed by the student."),
  level: z.enum(['B', 'C', 'D']).describe('The difficulty level of the exercise.'),
});
export type ValidatePhraseInput = z.infer<typeof ValidatePhraseInputSchema>;

export const ValidatePhraseOutputSchema = z.object({
  isCorrect: z.boolean().describe('True if the sentence is considered correct, otherwise false.'),
  feedback: z.string().describe('A short, encouraging, and constructive feedback for the student, explaining why the sentence is correct or what could be improved. En français.'),
  correctedSentence: z.string().optional().describe('If the sentence is incorrect, provide a possible correct version. En français.'),
});
export type ValidatePhraseOutput = z.infer<typeof ValidatePhraseOutputSchema>;

const validatePhrasePrompt = ai.definePrompt({
    name: 'validatePhrasePrompt',
    input: { schema: ValidatePhraseInputSchema },
    output: { schema: ValidatePhraseOutputSchema },
    prompt: `Tu es un professeur de français bienveillant et un expert en linguistique. Tu évalues la phrase construite par un élève.

Voici la tâche de l'élève :
- Mots à utiliser : {{#each providedWords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Niveau : {{level}}

Voici la phrase de l'élève : "{{userSentence}}"

Évalue la phrase selon les 3 critères suivants :
1.  **Inclusion des mots** : Tous les mots fournis (ou leurs formes conjuguées/accordées) doivent être présents dans la phrase.
2.  **Correction grammaticale** : La phrase doit être grammaticalement correcte (conjugaison, accords, ordre des mots, ponctuation de base comme la majuscule au début et le point à la fin).
3.  **Cohérence sémantique** : La phrase doit avoir un sens logique et clair.

Analyse :
- Si les 3 critères sont remplis, la phrase est correcte. Le feedback doit être positif et encourageant.
- Si un ou plusieurs critères ne sont pas remplis, la phrase est incorrecte. Le feedback doit expliquer **gentiment et simplement** ce qui ne va pas (ex: "C'est un bon début, mais il manque un mot." ou "Fais attention à l'accord du verbe."). Propose une version corrigée si possible.

Le feedback doit être très court (une phrase) et adapté au niveau de l'élève.
`,
});

const validateConstructedPhraseFlow = ai.defineFlow(
    {
        name: 'validateConstructedPhraseFlow',
        inputSchema: ValidatePhraseInputSchema,
        outputSchema: ValidatePhraseOutputSchema,
    },
    async (input) => {
        const { output } = await validatePhrasePrompt(input);
        return output!;
    }
);

export async function validateConstructedPhrase(input: ValidatePhraseInput): Promise<ValidatePhraseOutput> {
    return validateConstructedPhraseFlow(input);
}
