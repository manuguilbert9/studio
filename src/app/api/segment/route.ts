'use server';

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const wordsegEndpoint = process.env.WORDSEG_ENDPOINT;
  if (!wordsegEndpoint) {
    return NextResponse.json({ error: "WORDSEG_ENDPOINT is not configured." }, { status: 500 });
  }

  try {
    const r = await fetch(wordsegEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.WORDSEG_API_KEY || ""
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("Error from wordseg service:", err);
      return NextResponse.json({ error: `Syllabification service error: ${err}` }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Failed to fetch syllabification service:", error);
    return NextResponse.json({ error: "Internal server error when contacting syllabification service." }, { status: 500 });
  }
}
