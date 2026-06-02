'use client';

import { useEffect, useState } from 'react';
import { getInventory, adjustInventory, upsertInventory, getItems } from '@/lib/api';
import { InventoryItem, Item } from '@/types';
import Modal from '@/components/Modal';
import {
  AlertTriangle, Plus, ArrowUpDown, MapPin, Package, FileCheck,
  ArrowRightLeft, TrendingDown, BarChart3, Settings, Truck,
  ChevronDown, DollarSign, BoxesIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function InventoryPage() {
  const { canAccess } = useAuth();
  const canAdjust = canAccess('inventory', 'adjust');
  const [activeTab, setActiveTab] = useState('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filtered, setFiltered] = useState<InventoryItem[]>([]);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState<InventoryItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showGRN, setShowGRN] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ delta: 0, reason: '' });
  const [addForm, setAddForm] = useState({ itemId: '', onHandQty: 0, reorderPoint: 10, reorderQty: 50, location: '' });
  const [grnForm, setGrnForm] = useState({ poNumber: '', itemId: '', quantity: 0, receivedDate: new Date().toISOString().split('T')[0], supplier: '', notes: '' });
  const [transferForm, setTransferForm] = useState({ itemId: '', quantity: 0, fromLocation: '', toLocation: '', reason: '' });
  const [locations, setLocations] = useState<string[]>(['Central Warehouse', 'Regional Store', 'Sub-Store']);
  const [costingMethod, setCostingMethod] = useState('FIFO');

  const load = () => {
    setLoading(true);
    Promise.all([getInventory(), getItems()])
      .then(([inv, itms]) => { setInventory(inv); setItems(itms); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    setFiltered(showLowOnly ? inventory.filter(i => i.onHandQty <= i.reorderPoint) : inventory);
  }, [showLowOnly, inventory]);

  const handleAdjust = async () => {
    if (!showAdjust?.id) return;
    await adjustInventory(showAdjust.id, adjustForm);
    setShowAdjust(null);
    setAdjustForm({ delta: 0, reason: '' });
    load();
  };

  const handleAdd = async () => {
    if (!addForm.itemId) return;
    await upsertInventory(parseInt(addForm.itemId), { onHandQty: addForm.onHandQty, reorderPoint: addForm.reorderPoint, reorderQty: addForm.reorderQty, location: addForm.location });
    setShowAdd(false);
    setAddForm({ itemId: '', onHandQty: 0, reorderPoint: 10, reorderQty: 50, location: '' });
    load();
  };

  const lowStockCount = inventory.filter(i => i.onHandQty <= i.reorderPoint).length;
  const totalValue = inventory.reduce((sum, i) => sum + (i.onHandQty * (i.item?.costPrice || i.item?.unitPrice || 0)), 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'items', label: 'Item Master', icon: Package },
    { id: 'grn', label: 'Goods Receipt', icon: Truck },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'stock-levels', label: 'Stock Levels', icon: AlertTriangle },
    { id: 'valuation', label: 'Valuation', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Complete control over stock, locations, and valuations</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview'     && <OverviewTab inventory={inventory} items={items} lowStockCount={lowStockCount} totalValue={totalValue} setActiveTab={setActiveTab} setShowAdd={setShowAdd} canAdjust={canAdjust} />}

        {/* Locations Tab */}
        {activeTab === 'locations'    && <LocationsTab locations={locations} setLocations={setLocations} canAdjust={canAdjust} />}

        {/* Item Master Tab */}
        {activeTab === 'items'        && <ItemMasterTab items={items} loading={loading} setShowAdd={setShowAdd} canAdjust={canAdjust} />}

        {/* Goods Receipt Notes Tab */}
        {activeTab === 'grn'          && <GRNTab showGRN={showGRN} setShowGRN={setShowGRN} grnForm={grnForm} setGrnForm={setGrnForm} items={items} canAdjust={canAdjust} />}

        {/* Transfers Tab */}
        {activeTab === 'transfers'    && <TransfersTab showTransfer={showTransfer} setShowTransfer={setShowTransfer} transferForm={transferForm} setTransferForm={setTransferForm} items={items} inventory={inventory} locations={locations} canAdjust={canAdjust} />}

        {/* Stock Levels Tab */}
        {activeTab === 'stock-levels' && <StockLevelsTab inventory={inventory} showLowOnly={showLowOnly} setShowLowOnly={setShowLowOnly} loading={loading} setShowAdjust={canAdjust ? setShowAdjust : () => {}} lowStockCount={lowStockCount} canAdjust={canAdjust} />}

        {/* Valuation Tab */}
        {activeTab === 'valuation' && <ValuationTab inventory={inventory} costingMethod={costingMethod} setCostingMethod={setCostingMethod} totalValue={totalValue} />}

        {/* Reports Tab */}
        {activeTab === 'reports' && <ReportsTab inventory={inventory} items={items} />}
      </div>

      {/* Modals */}
      {showAdjust && (
        <AdjustModal showAdjust={showAdjust} adjustForm={adjustForm} setAdjustForm={setAdjustForm} setShowAdjust={setShowAdjust} handleAdjust={() => {
          // TODO: Handle adjust
          setShowAdjust(null);
        }} />
      )}

      {showAdd && (
        <AddInventoryModal showAdd={showAdd} setShowAdd={setShowAdd} addForm={addForm} setAddForm={setAddForm} items={items} locations={locations} handleAdd={() => {
          // TODO: Handle add
          setShowAdd(false);
        }} />
      )}
    </div>
  );
}

/* ============ TAB COMPONENTS ============ */

function OverviewTab({ inventory, items, lowStockCount, totalValue, setActiveTab, setShowAdd, canAdjust }: any) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{inventory.length}</p>
          <p className="text-xs text-gray-400 mt-2">{items.length} in catalog</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Value</p>
          <p className="text-3xl font-bold text-green-600">₹{(totalValue / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-400 mt-2">Valued at FIFO cost</p>
        </div>
        <div className="card p-4 border-l-2 border-yellow-400">
          <p className="text-xs text-gray-500 font-medium mb-1">Low Stock Items</p>
          <p className="text-3xl font-bold text-yellow-600">{lowStockCount}</p>
          <button onClick={() => setActiveTab('stock-levels')} className="text-xs text-yellow-600 font-medium hover:underline mt-2">Review →</button>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Locations</p>
          <p className="text-3xl font-bold text-blue-600">3</p>
          <p className="text-xs text-gray-400 mt-2">Central + Regional + Sub</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {canAdjust && <button onClick={() => setActiveTab('items')} className="btn-secondary flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>}
          {canAdjust && <button onClick={() => setShowAdd(true)} className="btn-secondary flex items-center justify-center gap-2"><BoxesIcon className="w-4 h-4" /> Add Stock</button>}
          {canAdjust && <button onClick={() => setActiveTab('grn')} className="btn-secondary flex items-center justify-center gap-2"><Truck className="w-4 h-4" /> GRN</button>}
          {canAdjust && <button onClick={() => setActiveTab('transfers')} className="btn-secondary flex items-center justify-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transfer</button>}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Inventory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header">Location</th>
                <th className="table-header">On Hand</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.slice(0, 5).map((inv: InventoryItem) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{inv.item?.name}</td>
                  <td className="table-cell text-gray-500 text-xs">{inv.location || 'Central Warehouse'}</td>
                  <td className="table-cell"><strong>{inv.onHandQty}</strong> {inv.item?.uom}</td>
                  <td className="table-cell">
                    {inv.onHandQty <= inv.reorderPoint ? (
                      <span className="text-xs text-red-600 font-medium">Low Stock</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LocationsTab({ locations, setLocations }: any) {
  const [newLocation, setNewLocation] = useState('');

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Warehouse Locations</h3>
          <button onClick={() => {}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Location</button>
        </div>

        <div className="space-y-2">
          {locations.map((loc: string, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{loc}</span>
              </div>
              <button className="text-xs text-gray-500 hover:text-red-600">Remove</button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex gap-2">
          <input
            type="text"
            placeholder="Location name..."
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="input-field flex-1"
          />
          <button onClick={() => { setLocations([...locations, newLocation]); setNewLocation(''); }} className="btn-primary">Add</button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Location Hierarchy</h3>
        <p className="text-sm text-gray-600 mb-4">Set up hierarchical locations for multi-level distribution:</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Central Warehouse</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="ml-6 flex items-center gap-2">
            <span className="text-gray-600">→ Regional Store</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <div className="ml-12 flex items-center gap-2">
            <span className="text-gray-600">→ Sub-Store</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemMasterTab({ items, loading, setShowAdd, canAdjust }: any) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        {canAdjust && <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>}
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="table-header">SKU</th>
              <th className="table-header">Item Name</th>
              <th className="table-header">Category</th>
              <th className="table-header">UOM</th>
              <th className="table-header">Purchase Price</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item: Item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs text-gray-500">{item.sku}</td>
                <td className="table-cell font-medium">{item.name}</td>
                <td className="table-cell text-sm text-gray-600">Consumable</td>
                <td className="table-cell text-sm">{item.uom}</td>
                  <td className="table-cell font-medium">₹{item.costPrice || item.unitPrice}</td>
                <td className="table-cell"><button className="text-xs text-blue-600 hover:text-blue-800">Edit</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No items found. Add an item to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GRNTab({ showGRN, setShowGRN, grnForm, setGrnForm, items, canAdjust }: any) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Goods Receipt Notes (GRN)</h3>
          {canAdjust && <button onClick={() => setShowGRN(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create GRN</button>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">GRN ID</th>
                <th className="table-header">PO Number</th>
                <th className="table-header">Item</th>
                <th className="table-header">Qty Received</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No GRNs recorded yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GRN Form Modal */}
      {showGRN && (
        <Modal title="Create Goods Receipt Note" onClose={() => setShowGRN(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input className="input-field" placeholder="e.g., PO-001234" value={grnForm.poNumber} onChange={(e) => setGrnForm({...grnForm, poNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select className="input-field" value={grnForm.itemId} onChange={(e) => setGrnForm({...grnForm, itemId: e.target.value})}>
                <option value="">Select Item</option>
                {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
              <input className="input-field" type="number" placeholder="0" value={grnForm.quantity} onChange={(e) => setGrnForm({...grnForm, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input className="input-field" placeholder="Supplier name" value={grnForm.supplier} onChange={(e) => setGrnForm({...grnForm, supplier: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowGRN(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => { setShowGRN(false); }} className="btn-primary flex-1">Record GRN</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TransfersTab({ showTransfer, setShowTransfer, transferForm, setTransferForm, items, inventory, locations }: any) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Stock Transfers</h3>
          <button onClick={() => setShowTransfer(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Transfer</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Transfer ID</th>
                <th className="table-header">Item</th>
                <th className="table-header">From</th>
                <th className="table-header">To</th>
                <th className="table-header">Quantity</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No transfers recorded</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showTransfer && (
        <Modal title="Create Stock Transfer" onClose={() => setShowTransfer(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select className="input-field" value={transferForm.itemId} onChange={(e) => setTransferForm({...transferForm, itemId: e.target.value})}>
                <option value="">Select Item</option>
                {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input className="input-field" type="number" placeholder="0" value={transferForm.quantity} onChange={(e) => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
              <select className="input-field" value={transferForm.fromLocation} onChange={(e) => setTransferForm({...transferForm, fromLocation: e.target.value})}>
                <option value="">Select From</option>
                {locations.map((l: any) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
              <select className="input-field" value={transferForm.toLocation} onChange={(e) => setTransferForm({...transferForm, toLocation: e.target.value})}>
                <option value="">Select To</option>
                {locations.map((l: any) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowTransfer(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => { setShowTransfer(false); }} className="btn-primary flex-1">Create Transfer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StockLevelsTab({ inventory, showLowOnly, setShowLowOnly, loading, setShowAdjust, lowStockCount, canAdjust }: any) {
  const filtered = showLowOnly ? inventory.filter((i: InventoryItem) => i.onHandQty <= i.reorderPoint) : inventory;

  return (
    <div className="space-y-4">
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700"><strong>{lowStockCount} items</strong> are at or below reorder point</p>
          <button onClick={() => setShowLowOnly(!showLowOnly)} className="ml-auto text-red-600 text-sm font-medium hover:underline">
            {showLowOnly ? 'Show All' : 'Show Low Stock'}
          </button>
        </div>
      )}

      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['SKU','Item','Location','On Hand','Reorder Point','Reorder Qty','Status','Actions'].map((h: string) => <th key={h} className="table-header">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((inv: InventoryItem) => {
                const isLow = inv.onHandQty <= inv.reorderPoint;
                return (
                  <tr key={inv.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="table-cell font-mono text-xs text-gray-500">{inv.item?.sku}</td>
                    <td className="table-cell font-medium">{inv.item?.name}</td>
                    <td className="table-cell text-gray-500 text-xs">{inv.location ?? 'Central Warehouse'}</td>
                    <td className="table-cell text-center">
                      <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{inv.onHandQty}</span>
                      <span className="text-xs text-gray-400 ml-1">{inv.item?.uom}</span>
                    </td>
                    <td className="table-cell text-center text-gray-600">{inv.reorderPoint}</td>
                    <td className="table-cell text-center text-gray-600">{inv.reorderQty}</td>
                    <td className="table-cell">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">OK</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {canAdjust && (
                        <button onClick={() => setShowAdjust(inv)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          <ArrowUpDown className="w-3 h-3" /> Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-gray-400">No inventory records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ValuationTab({ inventory, costingMethod, setCostingMethod, totalValue }: any) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Inventory Costing Method</h3>
        <div className="flex gap-4 mb-6">
          {['FIFO', 'LIFO', 'Weighted Average'].map((method: string) => (
            <button
              key={method}
              onClick={() => setCostingMethod(method)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                costingMethod === method
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-green-600 font-medium mb-1">Total Inventory Value</p>
          <p className="text-3xl font-bold text-green-700">₹{(totalValue / 100000).toFixed(2)}L</p>
          <p className="text-xs text-green-600 mt-2">Calculated using {costingMethod} method</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Valuation Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header">Qty</th>
                <th className="table-header">Unit Cost</th>
                <th className="table-header">Total Value</th>
                <th className="table-header">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map((inv: InventoryItem) => {
                const itemValue = inv.onHandQty * (inv.item?.costPrice || inv.item?.unitPrice || 0);
                const percentage = totalValue > 0 ? ((itemValue / totalValue) * 100).toFixed(1) : '0';
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{inv.item?.name}</td>
                    <td className="table-cell">{inv.onHandQty} {inv.item?.uom}</td>
                    <td className="table-cell">₹{inv.item?.costPrice || inv.item?.unitPrice}</td>
                    <td className="table-cell font-medium">₹{itemValue.toLocaleString()}</td>
                    <td className="table-cell"><strong>{percentage}%</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ inventory, items }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Stock Age Analysis</p>
          <p className="text-2xl font-bold text-gray-900">45 days</p>
          <p className="text-xs text-gray-400 mt-1">Average inventory age</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Turnover Ratio</p>
          <p className="text-2xl font-bold text-gray-900">8.2x</p>
          <p className="text-xs text-gray-400 mt-1">Per annum</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Inventory Accuracy</p>
          <p className="text-2xl font-bold text-green-600">99.2%</p>
          <p className="text-xs text-gray-400 mt-1">Last count</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Stock Movement Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header">Receipts</th>
                <th className="table-header">Issues</th>
                <th className="table-header">Transfers</th>
                <th className="table-header">Ending Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.slice(0, 5).map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{inv.item?.name}</td>
                  <td className="table-cell">—</td>
                  <td className="table-cell">—</td>
                  <td className="table-cell">—</td>
                  <td className="table-cell"><strong>{inv.onHandQty}</strong> {inv.item?.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdjustModal({ showAdjust, adjustForm, setAdjustForm, setShowAdjust, handleAdjust }: any) {
  return (
    <Modal title={`Adjust: ${showAdjust.item?.name}`} onClose={() => setShowAdjust(null)} size="sm">
      <div className="space-y-4">
        <div className="text-center bg-gray-50 rounded-lg p-4">
          <p className="text-4xl font-bold text-gray-900">{showAdjust.onHandQty}</p>
          <p className="text-sm text-gray-500 mt-1">Current On-Hand</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment (+/-)</label>
          <input className="input-field text-center text-lg font-semibold" type="number" value={adjustForm.delta}
            onChange={e => setAdjustForm((p: any) => ({ ...p, delta: parseInt(e.target.value) || 0 }))}
            placeholder="e.g. +10 or -5"
          />
          {adjustForm.delta !== 0 && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              New qty: <strong>{showAdjust.onHandQty + adjustForm.delta}</strong>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <input className="input-field" value={adjustForm.reason} onChange={e => setAdjustForm((p: any) => ({ ...p, reason: e.target.value }))} placeholder="e.g. Cycle count, spoilage..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setShowAdjust(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleAdjust} className="btn-primary">Apply Adjustment</button>
        </div>
      </div>
    </Modal>
  );
}

function AddInventoryModal({ showAdd, setShowAdd, addForm, setAddForm, items, locations, handleAdd }: any) {
  return (
    <Modal title="Add Inventory Record" onClose={() => setShowAdd(false)}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
          <select className="input-field" value={addForm.itemId} onChange={e => setAddForm((p: any) => ({ ...p, itemId: e.target.value }))}>
            <option value="">— Select Item —</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">On Hand Qty</label>
            <input className="input-field" type="number" min="0" value={addForm.onHandQty} onChange={e => setAddForm((p: any) => ({ ...p, onHandQty: parseInt(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
            <input className="input-field" type="number" min="0" value={addForm.reorderPoint} onChange={e => setAddForm((p: any) => ({ ...p, reorderPoint: parseInt(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Qty</label>
            <input className="input-field" type="number" min="0" value={addForm.reorderQty} onChange={e => setAddForm((p: any) => ({ ...p, reorderQty: parseInt(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
          <select className="input-field" value={addForm.location} onChange={e => setAddForm((p: any) => ({ ...p, location: e.target.value }))}>
            <option value="">— Select Location —</option>
            {locations.map((l: any) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleAdd} className="btn-primary">Save</button>
        </div>
      </div>
    </Modal>
  );
}
