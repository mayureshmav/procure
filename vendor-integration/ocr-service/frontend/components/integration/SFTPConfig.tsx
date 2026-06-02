'use client';

import { useState } from 'react';
import { Server, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface SFTPConfigData {
  host: string;
  port: string;
  username: string;
  password: string;
  remotePath: string;
  processedPath: string;
  failedPath: string;
  pollIntervalSeconds: string;
  enabled: boolean;
}

const defaultData: SFTPConfigData = {
  host: '',
  port: '22',
  username: '',
  password: '',
  remotePath: '/invoices/incoming',
  processedPath: '/invoices/processed',
  failedPath: '/invoices/failed',
  pollIntervalSeconds: '60',
  enabled: false,
};

export default function SFTPConfig() {
  const [data, setData] = useState<SFTPConfigData>(defaultData);
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (field: keyof SFTPConfigData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await fetch('/api/integration/sftp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save SFTP configuration.');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integration/sftp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed. Please check your settings.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Server className="h-5 w-5 text-brand-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">SFTP Configuration</h3>
          <p className="text-xs text-gray-500">Connect to your SFTP server to automatically pick up invoice files</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">Enable SFTP polling</span>
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
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Host / IP</label>
          <input
            type="text"
            className="input-base"
            placeholder="sftp.example.com"
            value={data.host}
            onChange={(e) => handleChange('host', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Port</label>
          <input
            type="number"
            className="input-base"
            placeholder="22"
            value={data.port}
            onChange={(e) => handleChange('port', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Username</label>
          <input
            type="text"
            className="input-base"
            placeholder="sftp_user"
            value={data.username}
            onChange={(e) => handleChange('username', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-base pr-10"
              placeholder="••••••••"
              value={data.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Incoming Documents Path</label>
          <input type="text" className="input-base" value={data.remotePath} onChange={(e) => handleChange('remotePath', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Processed Documents Path</label>
            <input type="text" className="input-base" value={data.processedPath} onChange={(e) => handleChange('processedPath', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Failed Documents Path</label>
            <input type="text" className="input-base" value={data.failedPath} onChange={(e) => handleChange('failedPath', e.target.value)} />
          </div>
        </div>
        <div className="w-48">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Poll Interval (seconds)</label>
          <input type="number" className="input-base" value={data.pollIntervalSeconds} onChange={(e) => handleChange('pollIntervalSeconds', e.target.value)} />
        </div>
      </div>

      {testResult && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          testResult.success ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {testResult.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave}>
          {saved && <CheckCircle className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
        <button className="btn-secondary" onClick={handleTest} disabled={testing}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </div>
  );
}
