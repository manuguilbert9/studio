
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  // En production avec Firebase Hosting + Cloud Run, la communication est directe.
  // En local, on utilise une variable d'environnement pour l'URL du service Python.
  const backendUrl = process.env.WORDSEG_ENDPOINT || 'http://127.0.0.1:8000';

  if (!backendUrl) {
    return NextResponse.json(
      {error: 'Backend service is not configured. WORDSEG_ENDPOINT is missing.'},
      {status: 500}
    );
  }

  try {
    const body = await req.json();

    // L'URL du service Python doit inclure le chemin /syllabify
    const pythonServiceUrl = `${backendUrl}/syllabify`;

    const backendResponse = await fetch(pythonServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(
        `Backend error: ${backendResponse.status} ${backendResponse.statusText}`,
        errorBody
      );
      return NextResponse.json(
        {error: 'Syllabification service error', details: errorBody},
        {status: backendResponse.status}
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      {error: 'Failed to proxy request to backend', details: error.message},
      {status: 500}
    );
  }
}
