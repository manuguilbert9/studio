
'use server';
/**
 * @fileOverview AI flows for the Phrase Construction exercise.
 *
 * - generatePhraseWords: Generates a set of words based on a difficulty level.
 * - validateConstructedPhrase: Validates a user-constructed phrase against given words and grammatical rules, providing a score.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Flow for generating words
// ===================================

const PhraseWordsInputSchema = z.object({
  level: z.enum(['B', 'C', 'D']).describe('The difficulty level (B: CP, C: CE1/CE2, D: CM1/CM2).'),
});
export type PhraseWordsInput = z.infer<typeof PhraseWordsInputSchema>;

const PhraseWordsOutputSchema = z.object({
  words: z.array(z.string()).describe('An array of words to be used to construct a sentence.'),
});
export type PhraseWordsOutput = z.infer<typeof PhraseWordsOutputSchema>;

const levelInstructions = {
    B: "Génère 3 mots simples et mélangés (sujet, verbe, adverbe ou adjectif). Le verbe doit être conjugué au présent de l'indicatif. Le vocabulaire doit être très concret et facile. La phrase à former doit être évidente. Exemple de sortie: ['dort', 'Camille', 'longtemps']. Varie les sujets et les verbes à chaque fois. Ne répète jamais les exemples.",
    C: "Génère 4 mots maximum (sujet, verbe, complément, adjectif). Le verbe peut être au présent ou au futur simple. La phrase à former doit être simple. Exemples: 'Achille boira du café chaud', 'Le lion mange une gazelle'. Pour les niveaux C et D, essaie de fournir des verbes à l'infinitif pour que l'élève doive réfléchir à la conjugaison. Varie les sujets et les verbes à chaque fois. Ne répète jamais les exemples.",
    D: "Génère 4 ou 5 mots, incluant potentiellement des mots de liaison ou des pronoms. Le verbe peut être au passé composé ou à l'imparfait. Le vocabulaire est plus avancé, la phrase à construire peut demander un peu de réflexion sur la syntaxe. Exemples : 'Le cheval galopait dans la prairie verte', 'Hier, nous avons mangé une délicieuse tarte'. Pour les niveaux C et D, essaie de fournir des verbes à l'infinitif pour que l'élève doive réfléchir à la conjugaison. Varie les sujets et les verbes à chaque fois. Ne répète jamais les exemples.",
};

const generateWordsPrompt = ai.definePrompt({
  name: 'generatePhraseWordsPrompt',
  input: { schema: PhraseWordsInputSchema },
  output: { schema: PhraseWordsOutputSchema },
  prompt: `Tu es un assistant pédagogique pour des élèves de primaire. Ta tâche est de générer une liste de mots pour un exercice de construction de phrase.

Niveau de difficulté : {{level}}
Instructions pour ce niveau : {{lookup ../levelInstructions level}}

Ne génère qu'une seule liste de mots.
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

const ValidatePhraseInputSchema = z.object({
  providedWords: z.array(z.string()).describe('The list of words that were given to the student.'),
  userSentence: z.string().describe("The sentence constructed by the student."),
  level: z.enum(['B', 'C', 'D']).describe('The difficulty level of the exercise.'),
});
export type ValidatePhraseInput = z.infer<typeof ValidatePhraseInputSchema>;

const ValidatePhraseOutputSchema = z.object({
  isCorrect: z.boolean().describe('True if the sentence is considered correct, otherwise false.'),
  feedback: z.string().describe('A short, encouraging, and constructive feedback for the student, explaining why the sentence is correct or what could be improved. En français.'),
  score: z.number().int().min(0).max(100).describe('A score from 0 to 100 evaluating the quality of the sentence.'),
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
1.  **Inclusion des mots** : Tous les mots fournis (ou leurs formes conjuguées/accordées) doivent être présents dans la phrase. Pour le niveau B, les mots doivent être utilisés tels quels. Pour les autres niveaux, l'élève peut conjuguer les verbes. (Pondération: 40%)
2.  **Correction grammaticale** : La phrase doit être grammaticalement correcte (conjugaison, accords, ordre des mots, ponctuation de base comme la majuscule au début et le point à la fin). (Pondération: 40%)
3.  **Cohérence sémantique** : La phrase doit avoir un sens logique et clair. (Pondération: 20%)

Analyse et notation :
- **isCorrect** : Ne doit être 'true' que si la phrase est absolument parfaite (les 3 critères sont remplis à 100%).
- **Feedback** : Donne un feedback court (une phrase) et adapté à l'élève. Si c'est correct, sois encourageant. Si c'est incorrect, explique **gentiment et simplement** ce qui ne va pas (ex: "C'est un bon début, mais il manque un mot." ou "Fais attention à l'accord du verbe."). Propose une version corrigée si possible.
- **Score** : Attribue un score sur 100 en te basant sur les pondérations.
    - Phrase parfaite = 100.
    - Petite erreur de ponctuation ou un mot manquant mais phrase compréhensible = 70-80.
    - Grosse erreur de grammaire ou de sens = 30-50.
    - Phrase complètement incohérente ou qui n'utilise pas les mots = 0-20.
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
