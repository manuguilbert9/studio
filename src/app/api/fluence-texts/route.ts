
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
function parseTextFile(content: string, level: string): Omit<FluenceText, 'level' | 'subCategory'> {
    const titleMatch = content.match(/<titre>(.*?)<\/titre>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Texte sans titre';
    
    const textContent = content.replace(/<titre>.*?<\/titre>\s*/, '').trim();
    
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
        const texts: FluenceText[] = [];
        
        const dirEntries = await fs.readdir(textsDir, { withFileTypes: true });

        for (const entry of dirEntries) {
            if (entry.isFile() && entry.name.endsWith('.txt')) {
                const filePath = path.join(textsDir, entry.name);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const parsedData = parseTextFile(fileContent, level);
                texts.push({
                    level: `Niveau ${level}`,
                    ...parsedData
                });
            } else if (entry.isDirectory()) {
                // If it's a directory, read files inside it (for level B)
                const subCategory = entry.name;
                const subDir = path.join(textsDir, subCategory);
                const filenames = await fs.readdir(subDir);
                const textFiles = filenames.filter(filename => filename.endsWith('.txt'));

                for (const filename of textFiles) {
                    const filePath = path.join(subDir, filename);
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const parsedData = parseTextFile(fileContent, level);
                    texts.push({
                        level: `Niveau ${level}`,
                        subCategory: subCategory,
                        ...parsedData
                    });
                }
            }
        }
        
        return NextResponse.json(texts);

    } catch (error) {
        console.error(`Erreur lors de la lecture des fichiers pour le niveau ${level}:`, error);
        return NextResponse.json({ error: `Impossible de charger les textes pour le niveau ${level}.` }, { status: 500 });
    }
}

