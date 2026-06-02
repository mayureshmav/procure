import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function dot(a: number[], b: number[]) { return a.reduce((s, v, i) => s + v * b[i], 0); }
function norm(a: number[]) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)); }
function cosine(a: number[], b: number[]) { return dot(a, b) / (norm(a) * norm(b) + 1e-12); }

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 400 });
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });

  const dataPath = path.join(process.cwd(), 'data', 'doc_embeddings.json');
  let items = [] as Array<{ id: string; path: string; chunk: string; embedding: number[] }>;
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    items = JSON.parse(raw);
  } catch (e) {
    return NextResponse.json({ error: 'embeddings not found, run indexer' }, { status: 404 });
  }

  // get embedding for query
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ input: q, model: 'text-embedding-3-small' }),
  });
  if (!res.ok) return NextResponse.json({ error: 'embedding failed' }, { status: 502 });
  const dat = await res.json();
  const qemb = dat.data[0].embedding as number[];

  const scored = items.map(it => ({ ...it, score: cosine(qemb, it.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 8).map(s => ({ path: s.path, excerpt: s.chunk.slice(0, 800), score: s.score }));
  return NextResponse.json({ results: top });
}
