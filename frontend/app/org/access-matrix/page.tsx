'use client';
import { useState } from 'react';
import { Save, Info, XCircle, Plus } from 'lucide-react';

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = [
  'System Admin', 'Finance Manager', 'AP Clerk', 'AR Clerk', 'GM', 'Dept Manager',
  'Purchasing Agent', 'Inventory Manager', 'Vendor User', 'Read Only',
];

// ── Modules & Permissions ─────────────────────────────────────────────────────
type Permission = 'full' | 'view' | 'none' | 'approve';

interface ModulePerms {
  module: string;
  group: string;
  actions: string[];
  matrix: Record<string, Permission>;
}

const MODULES: ModulePerms[] = [
  // Operations
  { module: 'Dashboard', group: 'Operations', actions: ['View'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'view', 'GM': 'full', 'Dept Manager': 'view', 'Purchasing Agent': 'view', 'Inventory Manager': 'view', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Vendors', group: 'Operations', actions: ['View', 'Create', 'Edit', 'Approve'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'none', 'GM': 'approve', 'Dept Manager': 'view', 'Purchasing Agent': 'full', 'Inventory Manager': 'view', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Purchase Orders', group: 'Operations', actions: ['View', 'Create', 'Submit', 'Receive', 'Close'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'none', 'GM': 'approve', 'Dept Manager': 'approve', 'Purchasing Agent': 'full', 'Inventory Manager': 'view', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Requisitions', group: 'Operations', actions: ['View', 'Create', 'Approve'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'none', 'GM': 'approve', 'Dept Manager': 'full', 'Purchasing Agent': 'full', 'Inventory Manager': 'view', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Order Guides', group: 'Operations', actions: ['View', 'Create', 'Edit'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'view', 'AP Clerk': 'none', 'AR Clerk': 'none', 'GM': 'full', 'Dept Manager': 'full', 'Purchasing Agent': 'full', 'Inventory Manager': 'view', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Inventory', group: 'Operations', actions: ['View', 'Adjust', 'Receive'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'view', 'AP Clerk': 'none', 'AR Clerk': 'none', 'GM': 'approve', 'Dept Manager': 'view', 'Purchasing Agent': 'view', 'Inventory Manager': 'full', 'Vendor User': 'none', 'Read Only': 'view' } },
  // Finance
  { module: 'Accounts Payable', group: 'Finance', actions: ['View', 'Process', 'Approve', 'Pay'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'full', 'AR Clerk': 'none', 'GM': 'approve', 'Dept Manager': 'approve', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Accounts Receivable', group: 'Finance', actions: ['View', 'Invoice', 'Collect'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'none', 'AR Clerk': 'full', 'GM': 'view', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'General Ledger', group: 'Finance', actions: ['View', 'Post', 'Adjust'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'view', 'GM': 'view', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Bank Reconciliation', group: 'Finance', actions: ['View', 'Reconcile'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'none', 'GM': 'view', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Payments', group: 'Finance', actions: ['View', 'Create', 'Sign Step 1', 'Sign Step 2'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'none', 'GM': 'approve', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Financial Reports', group: 'Finance', actions: ['View', 'Export', 'Schedule'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'view', 'GM': 'full', 'Dept Manager': 'view', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  { module: 'Tax Engine', group: 'Finance', actions: ['View', 'Configure', 'File'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'view', 'AR Clerk': 'none', 'GM': 'view', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'view' } },
  // System
  { module: 'User Management', group: 'System', actions: ['View', 'Create', 'Edit', 'Delete'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'none', 'AP Clerk': 'none', 'AR Clerk': 'none', 'GM': 'view', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'none' } },
  { module: 'Approval Engine', group: 'System', actions: ['View', 'Configure'],
    matrix: { 'System Admin': 'full', 'Finance Manager': 'full', 'AP Clerk': 'none', 'AR Clerk': 'none', 'GM': 'view', 'Dept Manager': 'none', 'Purchasing Agent': 'none', 'Inventory Manager': 'none', 'Vendor User': 'none', 'Read Only': 'none' } },
];

const PERM_LABEL: Record<Permission, string> = { full: 'Full', view: 'View', approve: 'Approve', none: '—' };
const PERM_COLOR: Record<Permission, string> = {
  full: 'bg-green-100 text-green-700',
  view: 'bg-blue-100 text-blue-600',
  approve: 'bg-purple-100 text-purple-700',
  none: 'bg-gray-50 text-gray-300',
};

const GROUPS = ['Operations', 'Finance', 'System'];

export default function AccessMatrixPage() {
  const [matrix, setMatrix] = useState(() => {
    const m: Record<string, Record<string, Permission>> = {};
    MODULES.forEach(mod => { m[mod.module] = { ...mod.matrix }; });
    return m;
  });
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [groupFilter, setGroupFilter] = useState('All');

  const cycle = (mod: string, role: string) => {
    const order: Permission[] = ['full', 'view', 'approve', 'none'];
    const curr = matrix[mod][role];
    const next = order[(order.indexOf(curr) + 1) % order.length];
    setMatrix(m => ({ ...m, [mod]: { ...m[mod], [role]: next } }));
    setSaved(false);
  };

  const filteredModules = MODULES.filter(m => groupFilter === 'All' || m.group === groupFilter);

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role-Based Access Matrix</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define what each role can see and do across all modules</p>
        </div>
        <button
          onClick={() => setSaved(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Save className="w-4 h-4" /> {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="text-gray-500 font-medium">Legend:</span>
        {Object.entries(PERM_LABEL).map(([k, v]) => (
          <span key={k} className={`px-2 py-0.5 rounded-full font-semibold ${PERM_COLOR[k as Permission]}`}>{v}</span>
        ))}
        <span className="text-gray-400 ml-2">Click any cell to cycle through permissions</span>
      </div>

      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0 text-amber-500" />
        Changes take effect immediately for all active sessions once saved. Roles are assigned to users via the Persons module.
      </div>

      {/* Group + Role filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1">
          {['All', ...GROUPS].map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${groupFilter === g ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Filter by role:</span>
          <select value={selectedRole ?? ''} onChange={e => setSelectedRole(e.target.value || null)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Matrix table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="min-w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '160px' }} />
            <col style={{ width: '80px' }} />
            {(selectedRole ? [selectedRole] : ROLES).map(r => <col key={r} style={{ width: '100px' }} />)}
          </colgroup>
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-gray-800 z-10">Module</th>
              <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide">Group</th>
              {(selectedRole ? [selectedRole] : ROLES).map(role => (
                <th key={role} className="px-2 py-3 text-xs font-semibold text-center leading-tight">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.filter(g => groupFilter === 'All' || g === groupFilter).map(group => {
              const groupMods = filteredModules.filter(m => m.group === group);
              if (!groupMods.length) return null;
              return [
                <tr key={group + '-header'} className="bg-gray-50 border-y border-gray-200">
                  <td colSpan={(selectedRole ? 1 : ROLES.length) + 2} className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest sticky left-0 bg-gray-50">
                    {group}
                  </td>
                </tr>,
                ...groupMods.map(mod => (
                  <tr key={mod.module} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium text-gray-800 sticky left-0 bg-white text-xs">{mod.module}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{mod.group}</td>
                    {(selectedRole ? [selectedRole] : ROLES).map(role => {
                      const perm = matrix[mod.module][role] as Permission;
                      return (
                        <td key={role} className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => cycle(mod.module, role)}
                            title={`${role}: ${PERM_LABEL[perm]} — click to change`}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold w-full transition-colors hover:opacity-75 ${PERM_COLOR[perm]}`}>
                            {PERM_LABEL[perm]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-right">
        {MODULES.length} modules · {ROLES.length} roles — click any permission cell to cycle: Full → View → Approve → None
      </div>
    </div>
  );
}
