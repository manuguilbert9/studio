
'use server';
/**
 * @fileOverview A flow for text-to-speech synthesis using Google Generative AI SDK directly.
 *
 * - textToSpeech - A function that converts text into speech audio.
 */

import { z } from 'zod';
import wav from 'wav';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------------------
// Config voix Gemini (whitelist + fallback)
// ---------------------------
const GEMINI_VOICES = new Set([
  'achernar','achird','algenib','algieba','alnilam','aoede','autonoe',
  'callirrhoe','charon','despina','enceladus','erinome','fenrir','gacrux',
  'iapetus','kore','laomedeia','leda','orus','puck','pulcherrima',
  'rasalgethi','sadachbia','sadaltager','schedar','sulafat','umbriel',
  'vindemiatrix','zephyr','zubenelgenubi'
]);
const DEFAULT_VOICE = 'algenib';

// Sortie
const TTSOutputSchema = z.object({
  media: z.string().describe('The base64 encoded WAV audio data URI.'),
});

/** PCM -> WAV (base64) */
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

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d: Buffer) => bufs.push(d));
    writer.on('finish', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

/** Extraction du PCM base64 depuis la réponse officielle du SDK */
function extractAudioBase64FromSDK(result: any): string | null {
  // Chemin officiel: result.response.candidates[0].content.parts[n].inlineData.data
  const cand = result?.response?.candidates?.[0];
  const parts: any[] = cand?.content?.parts ?? [];
  const p = parts.find(prt => prt?.inlineData?.data);
  return p?.inlineData?.data ?? null;
}

export async function textToSpeech(text: string): Promise<z.infer<typeof TTSOutputSchema>> {
  const cleaned = (text ?? '').trim();
  if (!cleaned) throw new Error('TTS: input text is empty.');

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY / GOOGLE_GENAI_API_KEY in environment.');
  }

  const voiceNameEnv = (process.env.GEMINI_TTS_VOICE || 'algenib').toLowerCase();
  const selectedVoice = GEMINI_VOICES.has(voiceNameEnv) ? voiceNameEnv : DEFAULT_VOICE;

  // Limite de sécurité : textes très longs peuvent provoquer des réponses vides
  const MAX_CHARS = 4000;
  const payloadText = cleaned.length > MAX_CHARS ? cleaned.slice(0, MAX_CHARS) : cleaned;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-tts',
  });

  // Appel direct à l’API Gemini TTS
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: `Parle en français métropolitain avec une diction naturelle. ${payloadText}` }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
      },
    },
  });

  // Diagnostic blocage/modération
  const pf = (result as any)?.response?.promptFeedback;
  if (pf?.blockReason) {
    console.error('TTS blocked:', JSON.stringify(pf, null, 2));
    throw new Error(`TTS request was blocked. Reason: ${pf.blockReason}`);
  }

  // Extraction audio
  const base64Pcm = extractAudioBase64FromSDK(result);
  if (!base64Pcm) {
    console.error(
      'TTS raw result (truncated):',
      JSON.stringify(
        result,
        (_k, v) => (typeof v === 'string' && v.length > 400 ? v.slice(0, 400) + '…' : v),
        2
      )
    );
    throw new Error('TTS: no audio returned by model.');
  }

  // PCM (24 kHz mono s16le) -> WAV
  const pcmBuffer = Buffer.from(base64Pcm, 'base64');
  const wavBase64 = await toWav(pcmBuffer);

  return { media: 'data:audio/wav;base64,' + wavBase64 };
}
