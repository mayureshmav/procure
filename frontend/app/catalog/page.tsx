'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getItems, createItem, updateItem, deleteItem, getVendors, getUoms } from '@/lib/api';
import { Item, Vendor, UomMaster, ProductStatus } from '@/types';
import Modal from '@/components/Modal';
import { Plus, Search, Pencil, Trash2, Weight, Upload, Filter, Tag, Package, Download, FileDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── CSV export helpers ────────────────────────────────────────────────────────

const CSV_COLUMNS = [
  { key: 'sku',                label: 'sku' },
  { key: 'vendorSku',          label: 'vendor_sku' },
  { key: 'name',               label: 'name' },
  { key: 'description',        label: 'description' },
  { key: 'category',           label: 'category' },
  { key: 'subCategory',        label: 'sub_category' },
  { key: 'brand',              label: 'brand' },
  { key: 'manufacturer',       label: 'manufacturer' },
  { key: 'countryOfOrigin',    label: 'country_of_origin' },
  { key: 'gtin',               label: 'gtin' },
  { key: 'upc',                label: 'upc' },
  { key: 'ean',                label: 'ean' },
  { key: 'vendorName',         label: 'vendor_name' },   // derived
  { key: 'uom',                label: 'uom' },
  { key: 'unitPrice',          label: 'unit_price' },
  { key: 'costPrice',          label: 'cost_price' },
  { key: 'rrp',                label: 'rrp' },
  { key: 'currencyCode',       label: 'currency_code' },
  { key: 'taxCode',            label: 'tax_code' },
  { key: 'taxRatePct',         label: 'tax_rate_pct' },
  { key: 'minOrderQty',        label: 'min_order_qty' },
  { key: 'maxOrderQty',        label: 'max_order_qty' },
  { key: 'orderIncrement',     label: 'order_increment' },
  { key: 'leadTimeDays',       label: 'lead_time_days' },
  { key: 'caseQty',            label: 'case_qty' },
  { key: 'innerPackQty',       label: 'inner_pack_qty' },
  { key: 'portionSize',        label: 'portion_size' },
  { key: 'portionsPerPack',    label: 'portions_per_pack' },
  { key: 'storageTemp',        label: 'storage_temp' },
  { key: 'shelfLifeDays',      label: 'shelf_life_days' },
  { key: 'catchWeight',        label: 'catch_weight' },
  { key: 'catchWeightMin',     label: 'catch_weight_min' },
  { key: 'catchWeightMax',     label: 'catch_weight_max' },
  { key: 'catchWeightNominal', label: 'catch_weight_nominal' },
  { key: 'hazmat',             label: 'hazmat' },
  { key: 'allergens',          label: 'allergens' },
  { key: 'grossWeight',        label: 'gross_weight' },
  { key: 'netWeight',          label: 'net_weight' },
  { key: 'lengthMm',           label: 'length_mm' },
  { key: 'widthMm',            label: 'width_mm' },
  { key: 'heightMm',           label: 'height_mm' },
  { key: 'productStatus',      label: 'product_status' },
  { key: 'effectiveDate',      label: 'effective_date' },
  { key: 'expireDate',         label: 'expire_date' },
  { key: 'substituteSku',      label: 'substitute_sku' },
];

function escapeCell(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n'))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function itemsToCSV(data: Item[]): string {
  const header = CSV_COLUMNS.map(c => c.label).join(',');
  const rows = data.map(item => {
    return CSV_COLUMNS.map(({ key }) => {
      if (key === 'vendorName') return escapeCell(item.vendor?.name ?? '');
      return escapeCell((item as any)[key]);
    }).join(',');
  });
  return [header, ...rows].join('\r\n');
}

const TEMPLATE_EXAMPLE_ROW = [
  'ITEM-001', 'VS-1234', 'Sample Product', 'A sample catalog item',
  'Beverages', 'Soft Drinks', 'Acme Brand', 'Acme Co.', 'IN',
  '00012345678905', '', '',
  'Acme Vendor',
  'CS', '150.00', '120.00', '175.00', 'INR', 'GST18', '18',
  '1', '100', '1', '3',
  '12', '1', '', '',
  'AMBIENT', '365',
  'FALSE', '', '', '', '',
  'FALSE', '',
  '0.5', '0.45', '200', '150', '300',
  'ACTIVE', '2024-01-01', '',
  '', '',
];

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY: Partial<Item> = {
  sku: '', name: '', description: '', category: '', unitPrice: 0,
  uom: 'EA', minOrderQty: 1, isActive: true, productStatus: 'ACTIVE',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  EXPIRED: 'bg-red-100 text-red-700',
  DISCONTINUED: 'bg-gray-100 text-gray-500',
  SEASONAL: 'bg-blue-100 text-blue-700',
  NEW: 'bg-indigo-100 text-indigo-700',
  ON_HOLD: 'bg-orange-100 text-orange-700',
};

export default function CatalogPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const canCreate = canAccess('catalog', 'create');
  const canEdit   = canAccess('catalog', 'edit');
  const canDelete = canAccess('catalog', 'delete');
  const canImport = canAccess('catalog', 'import');
  const [items, setItems]           = useState<Item[]>([]);
  const [vendors, setVendors]       = useState<Vendor[]>([]);
  const [uoms, setUoms]             = useState<UomMaster[]>([]);
  const [filtered, setFiltered]     = useState<Item[]>([]);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('ALL');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Partial<Item>>(EMPTY);
  const [isEdit, setIsEdit]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'basic' | 'pricing' | 'product'>('basic');

  const load = () => {
    setLoading(true);
    Promise.all([getItems(), getVendors(), getUoms().catch(() => [])])
      .then(([i, v, u]) => { setItems(i); setVendors(v); setUoms(u || []); setFiltered(i); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(items.filter(i => {
      const matchSearch = !q || [i.name, i.sku, i.category ?? '', i.brand ?? '', i.gtin ?? '']
        .some(f => f.toLowerCase().includes(q));
      const matchStatus = filterStatus === 'ALL' || i.productStatus === filterStatus;
      return matchSearch && matchStatus;
    }));
  }, [search, filterStatus, items]);

  const openCreate = () => { setEditing(EMPTY); setIsEdit(false); setActiveTab('basic'); setShowModal(true); };
  const openEdit   = (item: Item) => { setEditing({ ...item }); setIsEdit(true); setActiveTab('basic'); setShowModal(true); };

  const handleSave = async () => {
    const payload = { ...editing, vendor: editing.vendor?.id ? { id: editing.vendor.id } : undefined };
    if (isEdit && editing.id) await updateItem(editing.id, payload);
    else await createItem(payload);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await deleteItem(id);
    load();
  };

  const fmt = (n?: number) => n != null
    ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

  const handleExportData = () => {
    const data = filtered.length > 0 ? filtered : items;
    const csv  = itemsToCSV(data);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `catalog_export_${date}.csv`);
  };

  const handleExportTemplate = () => {
    const header = CSV_COLUMNS.map(c => c.label).join(',');
    const example = TEMPLATE_EXAMPLE_ROW.map(escapeCell).join(',');
    const notes = [
      '# CATALOG IMPORT TEMPLATE',
      '# Required fields: sku, name, uom, unit_price',
      '# product_status values: ACTIVE PENDING NEW SEASONAL EXPIRED DISCONTINUED ON_HOLD',
      '# storage_temp values: AMBIENT CHILLED FROZEN CONTROLLED',
      '# catch_weight: TRUE or FALSE',
      '# Dates: YYYY-MM-DD format',
      '# Remove these comment lines before importing',
    ].join('\r\n');
    downloadCSV(`${notes}\r\n${header}\r\n${example}`, 'catalog_import_template.csv');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Catalog</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} items · click row for full detail</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Export <span className="text-gray-400 text-xs">▾</span>
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-20 hidden group-hover:block">
              <button
                onClick={handleExportData}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left rounded-t-xl transition-colors"
              >
                <Download className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Export Data</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Download {filtered.length !== items.length ? `${filtered.length} filtered` : `all ${items.length}`} items as CSV
                  </div>
                </div>
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleExportTemplate}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left rounded-b-xl transition-colors"
              >
                <FileDown className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-800">Export Template</div>
                  <div className="text-xs text-gray-400 mt-0.5">Blank CSV with all columns + example row</div>
                </div>
              </button>
            </div>
          </div>
          {canImport && (
            <button onClick={() => router.push('/catalog/import')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Upload className="w-4 h-4" /> Import
            </button>
          )}
          {canCreate && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400" />
            <input className="flex-1 text-sm outline-none" placeholder="Search name, SKU, brand, GTIN…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="text-sm border-0 outline-none text-gray-600 bg-transparent"
              value={filterStatus} onChange={e => setFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {['ACTIVE','PENDING','NEW','SEASONAL','EXPIRED','DISCONTINUED','ON_HOLD'].map(s =>
                <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="p-10 text-center text-gray-400">Loading…</div> : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['SKU','Name','Category','Vendor','Unit Price','UOM','Status','','Actions'].map(h =>
                <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/catalog/products/${item.id}`)}>
                  <td className="table-cell font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.brand && <div className="text-xs text-gray-400">{item.brand}</div>}
                  </td>
                  <td className="table-cell">
                    <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded">
                      {item.category ?? '—'}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-600">{item.vendor?.name ?? '—'}</td>
                  <td className="table-cell font-semibold text-gray-900">{fmt(item.unitPrice)}</td>
                  <td className="table-cell text-gray-600">{item.uom}</td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.productStatus ?? 'ACTIVE']}`}>
                      {item.productStatus ?? 'ACTIVE'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {item.catchWeight && <span title="Catch Weight"><Weight className="w-3.5 h-3.5 text-blue-500" /></span>}
                      {item.gtin && <span title="Barcode"><Tag className="w-3.5 h-3.5 text-green-500" /></span>}
                      {item.priceBreaks && item.priceBreaks.length > 0 &&
                        <span title="Price Breaks"><Package className="w-3.5 h-3.5 text-orange-500" /></span>}
                    </div>
                  </td>
                  <td className="table-cell" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => item.id && handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  No items found.{' '}
                  <button onClick={openCreate} className="text-blue-600 underline">Add one</button> or{' '}
                  <button onClick={() => router.push('/catalog/import')} className="text-blue-600 underline">import a file</button>.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={isEdit ? 'Edit Item' : 'Add Item'} onClose={() => setShowModal(false)}>
          <div className="flex gap-1 border-b border-gray-200 mb-4 -mt-2">
            {(['basic','pricing','product'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'basic' ? 'Basic Info' : tab === 'pricing' ? 'Pricing & UOM' : 'Product Details'}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                {[['SKU *','sku'],['Vendor SKU','vendorSku'],['Brand','brand'],['Category','category'],['Sub-category','subCategory'],['Manufacturer','manufacturer']].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input className="input-field" value={(editing as any)[key] ?? ''}
                      onChange={e => setEditing(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input className="input-field" value={editing.name ?? ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select className="input-field" value={editing.vendor?.id ?? ''} onChange={e => setEditing(p => ({ ...p, vendor: vendors.find(v => v.id === +e.target.value) }))}>
                    <option value="">— Select Vendor —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="input-field" value={editing.productStatus ?? 'ACTIVE'} onChange={e => setEditing(p => ({ ...p, productStatus: e.target.value as ProductStatus }))}>
                    {['ACTIVE','PENDING','NEW','SEASONAL','EXPIRED','DISCONTINUED','ON_HOLD'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GTIN</label>
                  <input className="input-field" value={editing.gtin ?? ''} onChange={e => setEditing(p => ({ ...p, gtin: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UPC</label>
                  <input className="input-field" value={editing.upc ?? ''} onChange={e => setEditing(p => ({ ...p, upc: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="isActive" checked={editing.isActive ?? true} onChange={e => setEditing(p => ({ ...p, isActive: e.target.checked }))} />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="input-field" rows={2} value={editing.description ?? ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
            )}
            {activeTab === 'pricing' && (
              <div className="grid grid-cols-2 gap-3">
                {[['Unit Price (₹) *','unitPrice'],['Cost Price (₹)','costPrice'],['RRP (₹)','rrp'],['Tax Rate %','taxRatePct'],['Min Order Qty','minOrderQty'],['Max Order Qty','maxOrderQty'],['Order Increment','orderIncrement'],['Lead Time (days)','leadTimeDays']].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input className="input-field" type="number" min="0" step="0.01"
                      value={(editing as any)[key] ?? ''} onChange={e => setEditing(p => ({ ...p, [key]: parseFloat(e.target.value) }))} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
                  <select className="input-field" value={editing.uom ?? 'EA'} onChange={e => setEditing(p => ({ ...p, uom: e.target.value }))}>
                    {uoms.length > 0
                      ? uoms.map(u => <option key={u.code} value={u.code}>{u.code} — {u.description}</option>)
                      : ['EA','CS','KG','LB','L','DZ','BOX','BAG','BTL','TIN','CAN','RM'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input className="input-field" value={editing.currencyCode ?? 'INR'} onChange={e => setEditing(p => ({ ...p, currencyCode: e.target.value }))} />
                </div>
              </div>
            )}
            {activeTab === 'product' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Storage Temp</label>
                  <select className="input-field" value={editing.storageTemp ?? ''} onChange={e => setEditing(p => ({ ...p, storageTemp: e.target.value as any }))}>
                    <option value="">— None —</option>
                    {['AMBIENT','CHILLED','FROZEN','CONTROLLED'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life (days)</label>
                  <input className="input-field" type="number" min="0" value={editing.shelfLifeDays ?? ''} onChange={e => setEditing(p => ({ ...p, shelfLifeDays: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case Qty</label>
                  <input className="input-field" type="number" min="0" value={editing.caseQty ?? ''} onChange={e => setEditing(p => ({ ...p, caseQty: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin (ISO)</label>
                  <input className="input-field" maxLength={3} value={editing.countryOfOrigin ?? ''} onChange={e => setEditing(p => ({ ...p, countryOfOrigin: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input className="input-field" type="date" value={editing.effectiveDate ?? ''} onChange={e => setEditing(p => ({ ...p, effectiveDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
                  <input className="input-field" type="date" value={editing.expireDate ?? ''} onChange={e => setEditing(p => ({ ...p, expireDate: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="catchWeight" checked={editing.catchWeight ?? false} onChange={e => setEditing(p => ({ ...p, catchWeight: e.target.checked }))} />
                  <label htmlFor="catchWeight" className="text-sm text-gray-700">Catch Weight Item</label>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="hazmat" checked={editing.hazmat ?? false} onChange={e => setEditing(p => ({ ...p, hazmat: e.target.checked }))} />
                  <label htmlFor="hazmat" className="text-sm text-gray-700">Hazardous Material</label>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">{isEdit ? 'Update' : 'Create'} Item</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
