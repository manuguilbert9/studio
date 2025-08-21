
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    return NextResponse.json(
      {error: 'Backend service is not configured'},
      {status: 500}
    );
  }

  try {
    const body = await req.json();

    const backendResponse = await fetch(`${backendUrl}/syllabify`, {
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
    