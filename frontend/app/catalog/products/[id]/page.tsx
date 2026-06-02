'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getItem, updateItem } from '@/lib/api';
import { Item } from '@/types';
import {
  ArrowLeft, Package, Thermometer, Tag, Weight, DollarSign,
  Calendar, AlertTriangle, Save, Pencil
} from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card p-5 mb-4">
    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
  if (value == null || value === '') return null;
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900">{String(value)}</div>
    </div>
  );
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [item, setItem]     = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [edit, setEdit]       = useState(false);
  const [draft, setDraft]     = useState<Partial<Item>>({});

  useEffect(() => {
    getItem(Number(id))
      .then(i => { setItem(i); setDraft(i); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateItem(Number(id), draft);
      setItem(updated);
      setDraft(updated);
      setEdit(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading product…</div>;
  if (!item)   return <div className="p-10 text-center text-red-400">Product not found.</div>;

  const fmt = (n?: number | null) => n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-500 text-sm">SKU: <span className="font-mono">{item.sku}</span>
              {item.vendor && ` · ${item.vendor.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {edit ? (
            <>
              <button onClick={() => setEdit(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={() => setEdit(true)} className="btn-primary flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left column */}
        <div className="col-span-2 space-y-4">
          <Section title="Identification">
            <div className="grid grid-cols-3 gap-4">
              <Field label="SKU" value={item.sku} />
              <Field label="Vendor SKU" value={item.vendorSku} />
              <Field label="Status" value={item.productStatus} />
              <Field label="Category" value={item.category} />
              <Field label="Sub-category" value={item.subCategory} />
              <Field label="Brand" value={item.brand} />
              <Field label="Manufacturer" value={item.manufacturer} />
              <Field label="Country of Origin" value={item.countryOfOrigin} />
            </div>
            {item.description && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-3">{item.description}</div>
            )}
          </Section>

          <Section title="Barcodes">
            <div className="grid grid-cols-3 gap-4">
              <Field label="GTIN-14" value={item.gtin} />
              <Field label="UPC-12" value={item.upc} />
              <Field label="EAN-13" value={item.ean} />
            </div>
            {!item.gtin && !item.upc && !item.ean && (
              <p className="text-sm text-gray-400">No barcodes registered.</p>
            )}
          </Section>

          <Section title="Pricing">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Unit Price" value={fmt(item.unitPrice)} />
              <Field label="Cost Price" value={fmt(item.costPrice)} />
              <Field label="RRP" value={fmt(item.rrp)} />
              <Field label="UOM" value={item.uom} />
              <Field label="Currency" value={item.currencyCode} />
              <Field label="Tax Rate %" value={item.taxRatePct} />
            </div>
          </Section>

          {item.priceBreaks && item.priceBreaks.length > 0 && (
            <Section title="Price Breaks">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Tier','Type','Min Qty/Amount','Max','Unit Price','Discount %'].map(h =>
                      <th key={h} className="text-left text-xs text-gray-500 font-medium py-1.5 pr-3">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {item.priceBreaks.map(pb => (
                    <tr key={pb.id} className="border-b border-gray-50">
                      <td className="py-2 pr-3 font-medium">T{pb.tierSequence}</td>
                      <td className="py-2 pr-3">{pb.breakType}</td>
                      <td className="py-2 pr-3">{pb.minValue}</td>
                      <td className="py-2 pr-3">{pb.maxValue ?? '∞'}</td>
                      <td className="py-2 pr-3">{fmt(pb.unitPrice)}</td>
                      <td className="py-2 pr-3">{pb.discountPct ? `${pb.discountPct}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <Section title="Ordering Rules">
            <div className="grid grid-cols-4 gap-4">
              <Field label="Min Order Qty" value={item.minOrderQty} />
              <Field label="Max Order Qty" value={item.maxOrderQty} />
              <Field label="Order Increment" value={item.orderIncrement} />
              <Field label="Lead Time (days)" value={item.leadTimeDays} />
            </div>
          </Section>

          <Section title="Pack / Portion">
            <div className="grid grid-cols-4 gap-4">
              <Field label="Case Qty" value={item.caseQty} />
              <Field label="Inner Pack Qty" value={item.innerPackQty} />
              <Field label="Portion Size" value={item.portionSize} />
              <Field label="Portions / Pack" value={item.portionsPerPack} />
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Section title="Storage">
            <div className="space-y-3">
              <Field label="Storage Temperature" value={item.storageTemp} />
              <Field label="Min Temp (°C)" value={item.storageTempMinC} />
              <Field label="Max Temp (°C)" value={item.storageTempMaxC} />
              <Field label="Shelf Life (days)" value={item.shelfLifeDays} />
            </div>
          </Section>

          <Section title="Date Lifecycle">
            <div className="space-y-3">
              <Field label="Effective Date" value={item.effectiveDate} />
              <Field label="Expire Date" value={item.expireDate} />
              <Field label="Discontinue Date" value={item.discontinueDate} />
              <Field label="New Until" value={item.newProductUntil} />
            </div>
          </Section>

          <Section title="Dimensions & Weight">
            <div className="space-y-3">
              <Field label="Gross Weight" value={item.grossWeight} />
              <Field label="Net Weight" value={item.netWeight} />
              <Field label="L × W × H (mm)" value={
                item.lengthMm ? `${item.lengthMm} × ${item.widthMm} × ${item.heightMm}` : undefined
              } />
            </div>
          </Section>

          {item.catchWeight && (
            <Section title="Catch Weight">
              <div className="space-y-3">
                <Field label="Min Weight" value={item.catchWeightMin} />
                <Field label="Max Weight" value={item.catchWeightMax} />
                <Field label="Nominal" value={item.catchWeightNominal} />
                <Field label="Tolerance %" value={item.catchWeightTolerancePct} />
                <Field label="Price Method" value={item.catchWeightPriceMethod} />
              </div>
            </Section>
          )}

          <Section title="Flags">
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                {item.isActive ? 'Active' : 'Inactive'}
              </div>
              {item.catchWeight && (
                <div className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-blue-50 text-blue-700">
                  <Weight className="w-3.5 h-3.5" /> Catch Weight
                </div>
              )}
              {item.hazmat && (
                <div className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-red-50 text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5" /> Hazardous Material
                </div>
              )}
            </div>
          </Section>

          <div className="text-xs text-gray-400 space-y-1 px-1">
            {item.lastImportedAt && <div>Imported: {new Date(item.lastImportedAt).toLocaleDateString()}</div>}
            {item.createdAt && <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>}
            {item.updatedAt && <div>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
