'use client';

import { useState } from 'react';
import type { OcrDocument } from '@/types';
import DocumentQueue from '@/components/ocr-review/DocumentQueue';
import DocumentDetail from '@/components/ocr-review/DocumentDetail';

export default function OcrReviewPage() {
  const [selected, setSelected] = useState<OcrDocument | null>(null);

  const handleUpdate = (updated: OcrDocument) => {
    setSelected(updated);
  };

  return (
    <div className="flex h-full">
      {/* Queue panel */}
      <div className={`flex flex-col p-6 transition-all duration-200 ${selected ? 'w-[58%]' : 'w-full'}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">OCR Review</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor the document processing queue, review extracted data and manually process stuck documents.
          </p>
        </div>
        <DocumentQueue
          onSelect={(doc) => setSelected(doc)}
          selectedId={selected?.id ?? null}
        />
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[42%] border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          <DocumentDetail
            doc={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        </div>
      )}
    </div>
  );
}
