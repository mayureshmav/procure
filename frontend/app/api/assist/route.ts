import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type Body = { message?: string };

async function searchDocs(query: string) {
  const root = path.resolve(process.cwd());
  const candidates = [
    path.join(root, 'UI-REFINEMENT-GUIDE.md'),
    path.join(root, 'README.md'),
    path.join(root, 'frontend', 'README.md'),
  ];
  const results: string[] = [];
  for (const p of candidates) {
    try {
      const txt = await fs.readFile(p, 'utf8');
      const lc = txt.toLowerCase();
      const q = query.toLowerCase();
      if (lc.includes(q)) {
        // return a short excerpt surrounding first match
        const idx = lc.indexOf(q);
        const start = Math.max(0, idx - 120);
        const end = Math.min(txt.length, idx + q.length + 120);
        results.push(`From ${path.relative(root, p)}: ...${txt.slice(start, end).replace(/\n+/g, ' ')}...`);
      }
    } catch (e) {
      // ignore missing files
    }
  }
  return results;
}

export async function POST(request: Request) {
  const body: Body = await request.json().catch(() => ({}));
  const message = (body.message || '').trim();

  const backend = process.env.CHAT_BACKEND_URL;
  if (backend) {
    // Proxy to external chat backend
    try {
      const res = await fetch(backend, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      return NextResponse.json({ reply: data.reply ?? data });
    } catch (err: any) {
      return NextResponse.json({ reply: `Chat backend error: ${String(err.message || err)}` }, { status: 502 });
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  // Use OpenAI if available
  if (openaiKey) {
    if (!message) return NextResponse.json({ reply: "Hello — how can I help? Ask about the UI or type 'docs: <term>' to search docs." });

    // Find a few doc excerpts to ground the response
    const q = message.toLowerCase().startsWith('docs:') ? message.slice(5).trim() : message.split(/[\s,.]+/).slice(0, 4).join(' ');
    const hits = await searchDocs(q);
    const systemParts = [
      'You are a helpful assistant for the ProcureX frontend application. Answer concisely and reference repository docs when relevant.',
    ];
    if (hits.length > 0) {
      systemParts.push('Relevant repository excerpts:\n' + hits.slice(0, 3).join('\n\n'));
    }

    try {
      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemParts.join('\n\n') },
          { role: 'user', content: message },
        ],
        max_tokens: 800,
        temperature: 0.2,
      };

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => 'no body');
        return NextResponse.json({ reply: `OpenAI error: ${res.status} ${text}` }, { status: 502 });
      }
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
      return NextResponse.json({ reply });
    } catch (err: any) {
      return NextResponse.json({ reply: `OpenAI error: ${String(err.message || err)}` }, { status: 502 });
    }
  }

  // Fallback: simple doc-aware reply
  if (!message) return NextResponse.json({ reply: "Hello — how can I help? Ask about the UI or type 'docs: &lt;term&gt;' to search docs." });

  if (message.toLowerCase().startsWith('docs:')) {
    const q2 = message.slice(5).trim();
    if (!q2) return NextResponse.json({ reply: 'Please provide a search term after "docs:"' });
    const hits2 = await searchDocs(q2);
    if (hits2.length === 0) return NextResponse.json({ reply: `No docs matched '${q2}'.` });
    return NextResponse.json({ reply: hits2.join('\n\n') });
  }

  // Otherwise try to answer by searching docs for keywords
  const hits3 = await searchDocs(message.split(/[\s,.]+/).slice(0,3).join(' '));
  if (hits3.length > 0) {
    return NextResponse.json({ reply: `I found these excerpts that may help:\n\n${hits3.join('\n\n')}` });
  }

  // Default fallback
  return NextResponse.json({ reply: "I'm a lightweight assistant stub. Add CHAT_BACKEND_URL or OPENAI_API_KEY to enable a real agent, or try 'docs: &lt;term&gt;' to search repository docs." });
}
