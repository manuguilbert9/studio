
'use server';

// @ts-ignore
import cpText1 from '@/data/public/fluence/CP/Le-chat-et-le-soleil.txt';
// @ts-ignore
import cpText2 from '@/data/public/fluence/CP/La-petite-poule-rousse.txt';
// @ts-ignore
import ce1Text1 from '@/data/public/fluence/CE1/Le-renard-et-la-cigogne.txt';
// @ts-ignore
import ce1Text2 from '@/data/public/fluence/CE1/Le-secret-de-l-inventeur.txt';


const availableTexts: Record<string, Record<string, string>> = {
  "CP": {
    "Le-chat-et-le-soleil.txt": cpText1,
    "La-petite-poule-rousse.txt": cpText2,
  },
  "CE1": {
    "Le-renard-et-la-cigogne.txt": ce1Text1,
    "Le-secret-de-l-inventeur.txt": ce1Text2,
  }
};


export async function getAvailableTexts(): Promise<Record<string, string[]>> {
  const textsByLevel: Record<string, string[]> = {};
  for (const level in availableTexts) {
    textsByLevel[level] = Object.keys(availableTexts[level]);
  }
  return textsByLevel;
}

export async function getTextContent(level: string, filename: string): Promise<string> {
  try {
    return availableTexts[level][filename] || '';
  } catch (error) {
    console.error(`Failed to get text content for ${filename} in level ${level}:`, error);
    return '';
  }
}
