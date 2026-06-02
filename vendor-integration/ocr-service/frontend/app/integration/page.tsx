'use client';

import { useState } from 'react';
import { Server, Mail, ScanLine } from 'lucide-react';
import { clsx } from 'clsx';
import SFTPConfig from '@/components/integration/SFTPConfig';
import EmailConfig from '@/components/integration/EmailConfig';
import OCRSettings from '@/components/integration/OCRSettings';

const tabs = [
  { id: 'sftp', label: 'SFTP', icon: Server },
  { id: 'email', label: 'Email (IMAP)', icon: Mail },
  { id: 'ocr', label: 'OCR Settings', icon: ScanLine },
];

export default function IntegrationPage() {
  const [activeTab, setActiveTab] = useState('sftp');

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure how OCR Reader ingests documents and processes them through the pipeline.
        </p>
      </div>

      <div className="card overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <div className="flex gap-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={clsx(
                  'flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'sftp' && <SFTPConfig />}
          {activeTab === 'email' && <EmailConfig />}
          {activeTab === 'ocr' && <OCRSettings />}
        </div>
      </div>
    </div>
  );
}
