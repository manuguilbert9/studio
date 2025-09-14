
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface FluenceText {
    level: string;
    title: string;
    content: string;
    wordCount: number;
}

// Helper function to extract title and content from the file
function parseTextFile(content: string, level: string): Omit<FluenceText, 'level'> {
    const titleMatch = content.match(/<titre>(.*?)<\/titre>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Texte sans titre';
    
    // Remove the title tag from the content
    const textContent = content.replace(/<titre>.*?<\/titre>\s*/, '').trim();
    
    // Count words by splitting by spaces and filtering out empty strings
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    return { title, content: textContent, wordCount };
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (!level || !['B', 'C', 'D'].includes(level)) {
        return NextResponse.json({ error: 'Niveau invalide ou manquant.' }, { status: 400 });
    }

    try {
        const textsDir = path.join(process.cwd(), 'public', 'fluence', level);
        const filenames = await fs.readdir(textsDir);
        
        const textFiles = filenames.filter(filename => filename.endsWith('.txt'));

        const texts: FluenceText[] = [];

        for (const filename of textFiles) {
            const filePath = path.join(textsDir, filename);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const parsedData = parseTextFile(fileContent, level);
            texts.push({
                level: `Niveau ${level}`,
                ...parsedData
            });
        }
        
        return NextResponse.json(texts);

    } catch (error) {
        console.error(`Erreur lors de la lecture des fichiers pour le niveau ${level}:`, error);
        return NextResponse.json({ error: `Impossible de charger les textes pour le niveau ${level}.` }, { status: 500 });
    }
}
