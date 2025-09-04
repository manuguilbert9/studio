
'use server';
/**
 * @fileOverview A flow for text-to-speech synthesis.
 *
 * - textToSpeech - A function that converts text into speech audio.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import wav from 'wav';

// Define the schema for the output
const TTSOutputSchema = z.object({
  media: z.string().describe('The base64 encoded WAV audio data URI.'),
});

/**
 * Converts PCM audio data to WAV format.
 * @param pcmData The raw PCM audio data as a Buffer.
 * @returns A promise that resolves with the base64 encoded WAV data.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Define the Genkit flow
const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: z.string(),
    outputSchema: TTSOutputSchema,
  },
  async (text) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'fr-FR-Studio-A' }
            }
        }
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No audio media was returned from the TTS model.');
    }

    // The media URL is a data URI with base64 encoded PCM data. We need to extract it.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    // Convert the PCM data to WAV format.
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


export async function textToSpeech(text: string): Promise<z.infer<typeof TTSOutputSchema>> {
    return await textToSpeechFlow(text);
}
