#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Please set OPENAI_API_KEY and rerun: OPENAI_API_KEY=sk-... npm run index-docs');
  process.exit(1);
}

async function gatherFiles() {
  const root = path.resolve(process.cwd());
  const candidates = [
    path.join(root, 'UI-REFINEMENT-GUIDE.md'),
    path.join(root, 'README.md'),
    path.join(root, 'frontend', 'README.md'),
  ];
  const files = [];
  for (const p of candidates) {
    try {
      const txt = await fs.readFile(p, 'utf8');
      files.push({ path: path.relative(root, p), text: txt });
    } catch (e) {
      // ignore
    }
  }
  return files;
}

function chunkText(text, maxLen = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + maxLen);
    const piece = text.slice(start, end);
    chunks.push(piece);
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks;
}

async function embed(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ input: texts, model: 'text-embedding-3-small' }),
  });
  if (!res.ok) throw new Error('Embedding request failed: ' + await res.text());
  const data = await res.json();
  return data.data.map(d => d.embedding);
}

async function main() {
  const outDir = path.join(process.cwd(), 'data');
  await fs.mkdir(outDir, { recursive: true });
  const files = await gatherFiles();
  const docs = [];
  for (const f of files) {
    const chunks = chunkText(f.text);
    for (let i = 0; i < chunks.length; i++) {
      docs.push({ id: `${f.path}::${i}`, path: f.path, chunk: chunks[i] });
    }
  }
  console.log('Preparing', docs.length, 'chunks for embedding');
  const batchSize = 32;
  const results = [];
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    const texts = batch.map(b => b.chunk);
    const embs = await embed(texts);
    for (let j = 0; j < batch.length; j++) {
      results.push({ ...batch[j], embedding: embs[j] });
    }
    console.log(`Embedded ${Math.min(i + batchSize, docs.length)} / ${docs.length}`);
  }
  const outPath = path.join(outDir, 'doc_embeddings.json');
  await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Wrote embeddings to', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
