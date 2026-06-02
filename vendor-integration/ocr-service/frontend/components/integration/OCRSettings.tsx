'use client';

import { useState } from 'react';
import { ScanLine, CheckCircle, Info } from 'lucide-react';

interface OCRSettingsData {
  language: string;
  ocrMode: string;
  confidenceThreshold: number;
  enableHandwriting: boolean;
  enableDuplicateDetection: boolean;
  enableAutoClassification: boolean;
  enableMLFeedback: boolean;
  mandatoryFields: string[];
  currencyFormats: string[];
}

const AVAILABLE_FIELDS = [
  'invoiceNumber', 'invoiceDate', 'vendorName', 'vendorAddress',
  'poReference', 'grandTotal', 'subtotal', 'taxAmount', 'bankDetails',
];

const FIELD_LABELS: Record<string, string> = {
  invoiceNumber: 'Invoice / CM Number',
  invoiceDate: 'Invoice / CM Date',
  vendorName: 'Vendor Name',
  vendorAddress: 'Vendor Address',
  poReference: 'PO Reference',
  grandTotal: 'Grand Total',
  subtotal: 'Subtotal',
  taxAmount: 'Tax Amount',
  bankDetails: 'Bank Details',
};

const defaultData: OCRSettingsData = {
  language: 'eng',
  ocrMode: '3',
  confidenceThreshold: 70,
  enableHandwriting: false,
  enableDuplicateDetection: true,
  enableAutoClassification: true,
  enableMLFeedback: false,
  mandatoryFields: ['invoiceNumber', 'invoiceDate', 'vendorName', 'grandTotal'],
  currencyFormats: ['USD', 'INR', 'EUR'],
};

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-gray-300'}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
  </button>
);

export default function OCRSettings() {
  const [data, setData] = useState<OCRSettingsData>(defaultData);
  const [saved, setSaved] = useState(false);

  const handleChange = <K extends keyof OCRSettingsData>(field: K, value: OCRSettingsData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const toggleMandatoryField = (field: string) => {
    const current = data.mandatoryFields;
    handleChange('mandatoryFields', current.includes(field) ? current.filter((f) => f !== field) : [...current, field]);
  };

  const handleSave = async () => {
    try {
      await fetch('/api/integration/ocr-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save OCR settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScanLine className="h-5 w-5 text-brand-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">OCR Engine Settings</h3>
          <p className="text-xs text-gray-500">Configure Tesseract extraction behaviour, confidence thresholds and validation rules</p>
        </div>
      </div>

      {/* Engine */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">OCR Language</label>
          <select className="input-base" value={data.language} onChange={(e) => handleChange('language', e.target.value)}>
            <option value="eng">English (eng)</option>
            <option value="eng+hin">English + Hindi (eng+hin)</option>
            <option value="eng+deu">English + German (eng+deu)</option>
            <option value="eng+fra">English + French (eng+fra)</option>
            <option value="eng+jpn">English + Japanese (eng+jpn)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Tesseract OCR Mode (PSM)</label>
          <select className="input-base" value={data.ocrMode} onChange={(e) => handleChange('ocrMode', e.target.value)}>
            <option value="3">3 — Fully automatic (recommended)</option>
            <option value="6">6 — Assume uniform block of text</option>
            <option value="11">11 — Sparse text (find as much text as possible)</option>
            <option value="13">13 — Treat image as single line</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Confidence Threshold: <span className="font-semibold text-brand-600">{data.confidenceThreshold}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={data.confidenceThreshold}
            onChange={(e) => handleChange('confidenceThreshold', Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>0% (flag everything)</span>
            <span>100% (flag nothing)</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Accepted Currencies</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  const cur = data.currencyFormats;
                  handleChange('currencyFormats', cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  data.currencyFormats.includes(c)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {[
          { key: 'enableHandwriting', label: 'Handwriting Recognition', desc: 'Process handwritten text in scanned documents (may reduce accuracy)' },
          { key: 'enableDuplicateDetection', label: 'Duplicate Invoice Detection', desc: 'Flag documents with matching invoice numbers already in the system' },
          { key: 'enableAutoClassification', label: 'Auto-classify Document Type', desc: 'Automatically detect if document is an Invoice or Credit Memo' },
          { key: 'enableMLFeedback', label: 'ML Feedback Loop', desc: 'Learn from manual corrections to improve extraction accuracy over time' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <Toggle
              value={data[key as keyof OCRSettingsData] as boolean}
              onChange={(v) => handleChange(key as keyof OCRSettingsData, v as never)}
            />
          </div>
        ))}
      </div>

      {/* Mandatory fields */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-medium text-gray-700">Mandatory Fields</label>
          <Info className="h-3.5 w-3.5 text-gray-400" title="Documents missing these fields will be flagged as Pending" />
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_FIELDS.map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => toggleMandatoryField(field)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                data.mandatoryFields.includes(field)
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              {FIELD_LABELS[field]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">Selected fields are required. Documents missing any will be flagged as <strong>Pending</strong>.</p>
      </div>

      <div>
        <button className="btn-primary" onClick={handleSave}>
          {saved && <CheckCircle className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
