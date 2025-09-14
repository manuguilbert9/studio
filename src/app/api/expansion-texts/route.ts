
'use server';

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export interface ExpansionTextInfo {
    id: string;
    title: string;
    sentenceCount: number;
}

export interface ExpansionTextContent {
    id: string;
    title: string;
    sentences: string[];
}

const expansionDir = path.join(process.cwd(), 'public', 'expansion');

async function getFileContent(filename: string): Promise<{ title: string; sentences: string[] }> {
    const filePath = path.join(expansionDir, filename);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    let title = lines.shift() || filename; // Use filename as fallback title
    
    // Remove <titre> tags from the title
    title = title.replace(/<\/?titre>/g, '').trim();

    const sentences = lines;

    return { title, sentences };
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    try {
        const filenames = (await fs.readdir(expansionDir)).filter(name => name.endsWith('.txt'));

        if (fileId) {
            // --- Return content of a specific file ---
            if (!filenames.includes(fileId)) {
                return NextResponse.json({ error: 'Fichier non trouvé.' }, { status: 404 });
            }
            const { title, sentences } = await getFileContent(fileId);
            const content: ExpansionTextContent = { id: fileId, title, sentences };
            return NextResponse.json(content);

        } else {
            // --- Return list of all available files ---
            const filesInfo: ExpansionTextInfo[] = [];
            for (const filename of filenames) {
                const { title, sentences } = await getFileContent(filename);
                filesInfo.push({
                    id: filename,
                    title: title,
                    sentenceCount: sentences.length
                });
            }
            return NextResponse.json(filesInfo);
        }
    } catch (error) {
        console.error(`Erreur lors de la lecture des fichiers d'expansion:`, error);
        return NextResponse.json({ error: `Impossible de charger les textes.` }, { status: 500 });
    }
}
