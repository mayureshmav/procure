import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const root = path.resolve(process.cwd());
  const candidates = [
    path.join(root, 'UI-REFINEMENT-GUIDE.md'),
    path.join(root, 'README.md'),
    path.join(root, 'frontend', 'README.md'),
  ];
  const out: Array<{ path: string; excerpt: string }> = [];
  for (const p of candidates) {
    try {
      const txt = await fs.readFile(p, 'utf8');
      if (!q || txt.toLowerCase().includes(q)) {
        const excerpt = q ? (() => {
          const idx = txt.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 120);
          const end = Math.min(txt.length, idx + q.length + 120);
          return txt.slice(start, end).replace(/\n+/g, ' ');
        })() : txt.slice(0, 400).replace(/\n+/g, ' ');
        out.push({ path: path.relative(root, p), excerpt });
      }
    } catch (e) { }
  }
  return NextResponse.json(out);
}
