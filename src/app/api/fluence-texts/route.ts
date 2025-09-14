
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface FluenceText {
    level: string;
    title: string;
    content: string;
    wordCount: number;
    subCategory?: string;
}

// Helper function to extract title and content from the file
function parseTextFile(content: string): Omit<FluenceText, 'level' | 'subCategory'> {
    const titleMatch = content.match(/<titre>(.*?)<\/titre>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Texte sans titre';
    
    const textContent = content.replace(/<titre>.*?<\/titre>\s*/, '').trim();
    
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    return { title, content: textContent, wordCount };
}

// Helper function to read texts from a directory
async function readTextsFromDir(directory: string, level: string, subCategory?: string): Promise<FluenceText[]> {
    const texts: FluenceText[] = [];
    try {
        const dirEntries = await fs.readdir(directory, { withFileTypes: true });

        for (const entry of dirEntries) {
            if (entry.isFile() && entry.name.endsWith('.txt')) {
                const filePath = path.join(directory, entry.name);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const parsedData = parseTextFile(fileContent);
                texts.push({
                    level: `Niveau ${level}`,
                    subCategory: subCategory,
                    ...parsedData
                });
            }
        }
    } catch (e) {
        // If directory doesn't exist or is not readable, just return an empty array.
        console.warn(`Could not read directory ${directory}, skipping.`);
    }
    return texts;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (!level || !['B', 'C', 'D'].includes(level)) {
        return NextResponse.json({ error: 'Niveau invalide ou manquant.' }, { status: 400 });
    }

    try {
        const textsDir = path.join(process.cwd(), 'public', 'fluence', level);
        let allTexts: FluenceText[] = [];
        
        // 1. Read files directly in the level directory (for C and D)
        const rootTexts = await readTextsFromDir(textsDir, level);
        allTexts = allTexts.concat(rootTexts);
        
        // 2. Look for subdirectories and read from them (for B)
        const dirEntries = await fs.readdir(textsDir, { withFileTypes: true });
        for (const entry of dirEntries) {
            if (entry.isDirectory()) {
                const subCategory = entry.name;
                const subDir = path.join(textsDir, subCategory);
                const subDirTexts = await readTextsFromDir(subDir, level, subCategory);
                allTexts = allTexts.concat(subDirTexts);
            }
        }

        return NextResponse.json(allTexts);

    } catch (error) {
        console.error(`Erreur lors de la lecture des fichiers pour le niveau ${level}:`, error);
        return NextResponse.json({ error: `Impossible de charger les textes pour le niveau ${level}.` }, { status: 500 });
    }
}
