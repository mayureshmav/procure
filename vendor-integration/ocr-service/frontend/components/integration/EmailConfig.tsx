'use client';

import { useState } from 'react';
import { Mail, Eye, EyeOff, CheckCircle, Plus, X } from 'lucide-react';

interface EmailConfigData {
  imapHost: string;
  imapPort: string;
  username: string;
  password: string;
  mailbox: string;
  processedLabel: string;
  allowedSenders: string[];
  subjectFilter: string;
  pollIntervalSeconds: string;
  enabled: boolean;
}

const defaultData: EmailConfigData = {
  imapHost: '',
  imapPort: '993',
  username: '',
  password: '',
  mailbox: 'INBOX',
  processedLabel: 'OCR-Processed',
  allowedSenders: [],
  subjectFilter: '',
  pollIntervalSeconds: '120',
  enabled: false,
};

export default function EmailConfig() {
  const [data, setData] = useState<EmailConfigData>(defaultData);
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSender, setNewSender] = useState('');

  const handleChange = (field: keyof EmailConfigData, value: string | boolean | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const addSender = () => {
    if (newSender.trim() && !data.allowedSenders.includes(newSender.trim())) {
      handleChange('allowedSenders', [...data.allowedSenders, newSender.trim()]);
      setNewSender('');
    }
  };

  const removeSender = (sender: string) => {
    handleChange('allowedSenders', data.allowedSenders.filter((s) => s !== sender));
  };

  const handleSave = async () => {
    try {
      await fetch('/api/integration/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save email configuration.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-5 w-5 text-brand-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Email (IMAP) Configuration</h3>
          <p className="text-xs text-gray-500">Monitor a mailbox and extract invoice PDFs from attachments</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">Enable email polling</span>
          <button
            type="button"
            onClick={() => handleChange('enabled', !data.enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              data.enabled ? 'bg-brand-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                data.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">IMAP Host</label>
          <input type="text" className="input-base" placeholder="imap.gmail.com" value={data.imapHost} onChange={(e) => handleChange('imapHost', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">IMAP Port</label>
          <input type="number" className="input-base" placeholder="993" value={data.imapPort} onChange={(e) => handleChange('imapPort', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Email Address</label>
          <input type="email" className="input-base" placeholder="invoices@company.com" value={data.username} onChange={(e) => handleChange('username', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Password / App Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-base pr-10"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Mailbox / Folder</label>
          <input type="text" className="input-base" value={data.mailbox} onChange={(e) => handleChange('mailbox', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Processed Label</label>
          <input type="text" className="input-base" placeholder="OCR-Processed" value={data.processedLabel} onChange={(e) => handleChange('processedLabel', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Subject Filter (optional)</label>
          <input type="text" className="input-base" placeholder="e.g. Invoice, Bill" value={data.subjectFilter} onChange={(e) => handleChange('subjectFilter', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Poll Interval (seconds)</label>
          <input type="number" className="input-base" value={data.pollIntervalSeconds} onChange={(e) => handleChange('pollIntervalSeconds', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Allowed Senders (whitelist)</label>
        <div className="flex gap-2">
          <input type="email" className="input-base" placeholder="vendor@example.com" value={newSender} onChange={(e) => setNewSender(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSender(); } }} />
          <button className="btn-secondary flex-shrink-0" onClick={addSender}><Plus className="h-4 w-4" /></button>
        </div>
        {data.allowedSenders.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.allowedSenders.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {s}
                <button onClick={() => removeSender(s)} className="ml-1 text-brand-500 hover:text-brand-700"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave}>
          {saved && <CheckCircle className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
