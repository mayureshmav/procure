"use client";

import { useState } from 'react';
import { MessageSquare, BookOpen, X } from 'lucide-react';
import Modal from '@/components/Modal';

const docs = [
  { title: 'UI Refinement Guide', path: '/UI-REFINEMENT-GUIDE.md' },
  { title: 'Frontend README', path: '/frontend/README.md' },
];

export default function ChatWidget() {

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'docs'>('chat');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ from: 'user' | 'agent'; text: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [docsResults, setDocsResults] = useState<Array<{ path: string; excerpt: string }>>([]);

  const filtered = docs.filter(d => d.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-white border border-neutral-200 hover:shadow-xl hover:bg-neutral-50 transition"
          aria-label="Customer assistance chat"
        >
          <MessageSquare className="w-5 h-5 text-primary-600" />
          <span className="hidden sm:inline text-sm font-medium text-neutral-700">Help</span>
        </button>
      </div>

      {open && (
        <Modal title={tab === 'chat' ? 'Customer Assistance' : 'Help & Docs'} onClose={() => setOpen(false)} size="lg" subtitle={tab === 'chat' ? 'Chat with our assistant' : 'Search repository help docs'}>
          <div className="flex gap-4">
            <div className="w-1/4 border-r pr-4">
              <nav className="flex flex-col gap-2">
                <button onClick={() => setTab('chat')} className={`text-sm text-left p-2 rounded ${tab==='chat' ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-neutral-600" /> Chat</div>
                </button>
                <button onClick={() => setTab('docs')} className={`text-sm text-left p-2 rounded ${tab==='docs' ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}>
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-neutral-600" /> Docs</div>
                </button>
              </nav>
            </div>

            <div className="flex-1">
              {tab === 'chat' ? (
                <div className="flex flex-col h-96">
                  <div className="flex-1 overflow-y-auto p-2 bg-neutral-50 rounded-md space-y-3">
                    {messages.length === 0 && (
                      <div className="text-sm text-neutral-500">Start a conversation — ask about UI changes or type 'docs: &lt;term&gt;' to search docs.</div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={`p-2 rounded ${m.from === 'user' ? 'bg-primary-50 self-end text-right' : 'bg-white border'}`}>
                        <div className={`text-sm ${m.from === 'user' ? 'text-primary-700' : 'text-neutral-800'}`}>{m.text}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input value={query} onChange={e => setQuery(e.target.value)} className="flex-1 input-field" placeholder="Type your question..." onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        const text = query.trim();
                        if (!text) return;
                        setMessages(m => [...m, { from: 'user', text }]);
                        setQuery('');
                        setSending(true);
                        try {
                          const res = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
                          const data = await res.json();
                          setMessages(m => [...m, { from: 'agent', text: data.reply }]);
                        } catch (err) {
                          setMessages(m => [...m, { from: 'agent', text: 'Error contacting assistant.' }]);
                        } finally { setSending(false); }
                      }
                    }} />
                    <button onClick={async () => {
                      const text = query.trim();
                      if (!text) return;
                      setMessages(m => [...m, { from: 'user', text }]);
                      setQuery('');
                      setSending(true);
                      try {
                        const res = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
                        const data = await res.json();
                        setMessages(m => [...m, { from: 'agent', text: data.reply }]);
                      } catch (err) {
                        setMessages(m => [...m, { from: 'agent', text: 'Error contacting assistant.' }]);
                      } finally { setSending(false); }
                    }} className="btn-primary" disabled={sending}>{sending ? '…' : 'Send'}</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex gap-2">
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search docs..." className="input-field w-full" />
                    <button className="btn-primary" onClick={async () => {
                      const q = query.trim();
                      if (!q) return;
                      try {
                        const res = await fetch(`/api/semantic?q=${encodeURIComponent(q)}`);
                          const data = await res.json();
                          setDocsResults(data.results ?? []);
                      } catch (e) {
                        setDocsResults([]);
                      }
                    }}>Search</button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {docsResults.length > 0 ? docsResults.map((d, idx) => (
                      <a key={idx} href={`/${d.path}`} className="block p-3 rounded border border-neutral-100 hover:bg-neutral-50">
                        <div className="text-sm font-medium text-neutral-900">{d.path}</div>
                        <div className="text-xs text-neutral-500 mt-1">{d.excerpt}</div>
                      </a>
                    )) : (
                      filtered.map((d, idx) => (
                        <a key={idx} href={d.path} className="block p-3 rounded border border-neutral-100 hover:bg-neutral-50">
                          <div className="text-sm font-medium text-neutral-900">{d.title}</div>
                          <div className="text-xs text-neutral-500 mt-1">{d.path}</div>
                        </a>
                      ))
                    )}
                    {filtered.length === 0 && docsResults.length === 0 && <div className="text-sm text-neutral-500">No documents found.</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
