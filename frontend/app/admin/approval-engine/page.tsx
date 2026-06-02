'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getApprovalPolicy, createApprovalPolicy, updateApprovalPolicy, activateApprovalPolicy,
  getApprovalRules, createApprovalRule, updateApprovalRule, deleteApprovalRule, reorderApprovalRules,
  getPositions, getOrgUnits,
} from '@/lib/api';
import {
  ApprovalPolicy, ApprovalRule, ApprovalCondition, ApprovalStep,
  ApprovalDocumentType, ApprovalConditionField, ApprovalConditionOperator,
  ApprovalStepType, ApprovalMode, ApprovalTimeout,
  Position, OrgUnit,
} from '@/types';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import {
  Plus, Pencil, Trash2, XCircle, Loader2, AlertCircle,
  ChevronUp, ChevronDown, Save, Shield, GitMerge, Filter,
  ArrowRight, ToggleLeft, ToggleRight, Zap, Info,
} from 'lucide-react';

// ── Local form types ───────────────────────────────────────────────────────────

type Tab = 'rules' | 'matrix';

type ConditionRow = {
  _id: string;
  field: ApprovalConditionField;
  operator: ApprovalConditionOperator;
  value: string;
  valueTo: string;
};

type StepRow = {
  _id: string;
  stepNumber: number;
  label: string;
  stepType: ApprovalStepType;
  positionIds: number[];
  approvalMode: ApprovalMode;
  approvalLimitAmount: string;
  timeoutHours: string;
  onTimeout: ApprovalTimeout;
};

type RuleForm = {
  name: string;
  description: string;
  active: boolean;
  stopOnMatch: boolean;
  documentTypes: ApprovalDocumentType[];
  conditions: ConditionRow[];
  steps: StepRow[];
};

// ── Constants ──────────────────────────────────────────────────────────────────

const DOC_TYPES: { type: ApprovalDocumentType; label: string; short: string }[] = [
  { type: 'REQUISITION',   label: 'Requisition',     short: 'REQ'   },
  { type: 'PO_STANDARD',   label: 'PO – Standard',   short: 'PO'    },
  { type: 'PO_BLANKET',    label: 'PO – Blanket',    short: 'BLNKT' },
  { type: 'PO_EMERGENCY',  label: 'PO – Emergency',  short: 'EMRG'  },
  { type: 'PO_SERVICE',    label: 'PO – Service',    short: 'SVC'   },
  { type: 'PO_CONFIRMING', label: 'PO – Confirming', short: 'CONF'  },
  { type: 'PO_PLANNED',    label: 'PO – Planned',    short: 'PLAN'  },
  { type: 'PO_STOREROOM',  label: 'PO – Storeroom',  short: 'STOR'  },
];

const COND_FIELDS: { value: ApprovalConditionField; label: string }[] = [
  { value: 'SPEND_AMOUNT', label: 'Spend Amount'          },
  { value: 'PO_TYPE',      label: 'PO Type'               },
  { value: 'DEPARTMENT',   label: 'Department / Org Unit' },
  { value: 'GL_ACCOUNT',   label: 'GL Account Code'       },
  { value: 'VENDOR',       label: 'Vendor'                },
  { value: 'COST_CENTER',  label: 'Cost Centre'           },
  { value: 'CATEGORY',     label: 'Item Category'         },
];

const OPS_BY_FIELD: Record<ApprovalConditionField, { value: ApprovalConditionOperator; label: string }[]> = {
  SPEND_AMOUNT: [
    { value: 'GTE',     label: '≥ at least'     },
    { value: 'GT',      label: '> greater than' },
    { value: 'LTE',     label: '≤ at most'      },
    { value: 'LT',      label: '< less than'    },
    { value: 'BETWEEN', label: 'is between'     },
    { value: 'EQ',      label: '= exactly'      },
  ],
  PO_TYPE:     [{ value: 'IN', label: 'is one of' }, { value: 'EQ', label: 'equals' }, { value: 'NEQ', label: 'is not' }],
  DEPARTMENT:  [{ value: 'EQ', label: 'is' }, { value: 'IN', label: 'is one of' }, { value: 'NEQ', label: 'is not' }],
  GL_ACCOUNT:  [{ value: 'STARTS_WITH', label: 'starts with' }, { value: 'EQ', label: 'equals' }, { value: 'CONTAINS', label: 'contains' }, { value: 'IN', label: 'is one of' }],
  VENDOR:      [{ value: 'EQ', label: 'is' }, { value: 'IN', label: 'is one of' }, { value: 'NEQ', label: 'is not' }],
  COST_CENTER: [{ value: 'EQ', label: 'equals' }, { value: 'STARTS_WITH', label: 'starts with' }],
  CATEGORY:    [{ value: 'EQ', label: 'is' }, { value: 'IN', label: 'is one of' }, { value: 'CONTAINS', label: 'contains' }],
};

const EMPTY_RULE_FORM: RuleForm = {
  name: '', description: '', active: true, stopOnMatch: true,
  documentTypes: ['PO_STANDARD', 'REQUISITION'], conditions: [], steps: [],
};

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const mkCondition = (): ConditionRow => ({ _id: uid(), field: 'SPEND_AMOUNT', operator: 'GTE', value: '', valueTo: '' });
const mkStep = (n: number): StepRow => ({
  _id: uid(), stepNumber: n, label: '', stepType: 'POSITION',
  positionIds: [], approvalMode: 'ANY_ONE', approvalLimitAmount: '',
  timeoutHours: '48', onTimeout: 'ESCALATE',
});

// ── Component ──────────────────────────────────────────────────────────────────

export default function ApprovalEnginePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  const [tab, setTab] = useState<Tab>('rules');

  // Policy
  const [policy, setPolicy]                     = useState<ApprovalPolicy | null>(null);
  const [policyLoading, setPolicyLoading]       = useState(true);
  const [showPolicyModal, setShowPolicyModal]   = useState(false);
  const [policyForm, setPolicyForm]             = useState({ name: '', description: '' });
  const [policyPending, setPolicyPending]       = useState(false);

  // Rules
  const [rules, setRules]                       = useState<ApprovalRule[]>([]);
  const [rulesLoading, setRulesLoading]         = useState(false);
  const [showRuleModal, setShowRuleModal]       = useState(false);
  const [isRuleEdit, setIsRuleEdit]             = useState(false);
  const [editingRuleId, setEditingRuleId]       = useState<string | null>(null);
  const [ruleForm, setRuleForm]                 = useState<RuleForm>(EMPTY_RULE_FORM);
  const [ruleSaving, setRuleSaving]             = useState(false);

  // Reference data
  const [positions, setPositions]               = useState<Position[]>([]);
  const [orgUnits, setOrgUnits]                 = useState<OrgUnit[]>([]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/unauthorized');
  }, [authLoading, isAdmin, router]);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadPolicy = useCallback(() => {
    setPolicyLoading(true);
    getApprovalPolicy()
      .then(p => {
        setPolicy(p);
        if (p?.id) {
          setRulesLoading(true);
          getApprovalRules(p.id)
            .then(r => setRules(Array.isArray(r) ? [...r].sort((a, b) => a.priority - b.priority) : []))
            .finally(() => setRulesLoading(false));
        }
      })
      .catch(() => {})
      .finally(() => setPolicyLoading(false));
  }, []);

  useEffect(() => {
    loadPolicy();
    getPositions()
      .then(d => setPositions(Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])))
      .catch(() => {});
    getOrgUnits({})
      .then(d => setOrgUnits(Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])))
      .catch(() => {});
  }, [loadPolicy]);

  // ── Policy handlers ────────────────────────────────────────────────────────
  const openPolicyModal = () => {
    setPolicyForm({ name: policy?.name ?? '', description: policy?.description ?? '' });
    setShowPolicyModal(true);
  };

  const savePolicy = async () => {
    setPolicyPending(true);
    try {
      if (policy?.id) {
        await updateApprovalPolicy(policy.id, policyForm);
      } else {
        await createApprovalPolicy({ ...policyForm, status: 'DRAFT' });
      }
      setShowPolicyModal(false);
      loadPolicy();
    } finally { setPolicyPending(false); }
  };

  const activatePolicy = async () => {
    if (!policy?.id) return;
    await activateApprovalPolicy(policy.id);
    loadPolicy();
  };

  // ── Rule list handlers ─────────────────────────────────────────────────────
  const openCreateRule = () => {
    setRuleForm(EMPTY_RULE_FORM);
    setIsRuleEdit(false);
    setEditingRuleId(null);
    setShowRuleModal(true);
  };

  const openEditRule = (rule: ApprovalRule) => {
    setRuleForm({
      name: rule.name, description: rule.description ?? '',
      active: rule.active, stopOnMatch: rule.stopOnMatch,
      documentTypes: [...rule.documentTypes],
      conditions: (rule.conditions ?? []).map(c => ({
        _id: uid(), field: c.field, operator: c.operator,
        value: c.value ?? '', valueTo: c.valueTo ?? '',
      })),
      steps: (rule.steps ?? []).map(s => ({
        _id: uid(), stepNumber: s.stepNumber, label: s.label ?? '',
        stepType: s.stepType, positionIds: [...(s.positionIds ?? [])],
        approvalMode: s.approvalMode,
        approvalLimitAmount: s.approvalLimitAmount != null ? String(s.approvalLimitAmount) : '',
        timeoutHours: s.timeoutHours != null ? String(s.timeoutHours) : '48',
        onTimeout: s.onTimeout ?? 'ESCALATE',
      })),
    });
    setIsRuleEdit(true);
    setEditingRuleId(rule.id ?? null);
    setShowRuleModal(true);
  };

  const saveRule = async () => {
    if (!policy?.id || !ruleForm.name || ruleForm.documentTypes.length === 0) return;
    setRuleSaving(true);
    try {
      const payload: Partial<ApprovalRule> = {
        name: ruleForm.name, description: ruleForm.description || undefined,
        active: ruleForm.active, stopOnMatch: ruleForm.stopOnMatch,
        documentTypes: ruleForm.documentTypes,
        priority: isRuleEdit
          ? (rules.find(r => r.id === editingRuleId)?.priority ?? rules.length + 1)
          : rules.length + 1,
        conditions: ruleForm.conditions.map(({ _id: _, valueTo, ...c }) => ({
          ...c, valueTo: valueTo || undefined,
        }) as ApprovalCondition),
        steps: ruleForm.steps.map(({ _id: _, approvalLimitAmount, timeoutHours, ...s }, i) => ({
          ...s, stepNumber: i + 1,
          approvalLimitAmount: approvalLimitAmount ? Number(approvalLimitAmount) : undefined,
          timeoutHours: timeoutHours ? Number(timeoutHours) : undefined,
        }) as ApprovalStep),
      };
      if (isRuleEdit && editingRuleId) {
        await updateApprovalRule(editingRuleId, payload);
      } else {
        await createApprovalRule(policy.id, payload);
      }
      setShowRuleModal(false);
      setRulesLoading(true);
      getApprovalRules(policy.id)
        .then(r => setRules(Array.isArray(r) ? [...r].sort((a, b) => a.priority - b.priority) : []))
        .finally(() => setRulesLoading(false));
    } finally { setRuleSaving(false); }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await deleteApprovalRule(id);
    setRules(r => r.filter(x => x.id !== id));
  };

  const moveRule = async (idx: number, dir: -1 | 1) => {
    const next = [...rules];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const reordered = next.map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(reordered);
    if (policy?.id) {
      reorderApprovalRules(policy.id, reordered.map(r => r.id!).filter(Boolean));
    }
  };

  const toggleRule = async (rule: ApprovalRule) => {
    await updateApprovalRule(rule.id!, { active: !rule.active });
    setRules(r => r.map(x => x.id === rule.id ? { ...x, active: !x.active } : x));
  };

  // ── Rule form helpers ──────────────────────────────────────────────────────
  const toggleDocType = (dt: ApprovalDocumentType) =>
    setRuleForm(f => ({
      ...f,
      documentTypes: f.documentTypes.includes(dt)
        ? f.documentTypes.filter(x => x !== dt)
        : [...f.documentTypes, dt],
    }));

  const addCondition    = () => setRuleForm(f => ({ ...f, conditions: [...f.conditions, mkCondition()] }));
  const removeCondition = (i: number) => setRuleForm(f => ({ ...f, conditions: f.conditions.filter((_, j) => j !== i) }));
  const updateCondition = (i: number, patch: Partial<ConditionRow>) =>
    setRuleForm(f => ({ ...f, conditions: f.conditions.map((c, j) => j === i ? { ...c, ...patch } : c) }));

  const addStep    = () => setRuleForm(f => ({ ...f, steps: [...f.steps, mkStep(f.steps.length + 1)] }));
  const removeStep = (i: number) =>
    setRuleForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, stepNumber: j + 1 })) }));
  const updateStep = (i: number, patch: Partial<StepRow>) =>
    setRuleForm(f => ({ ...f, steps: f.steps.map((s, j) => j === i ? { ...s, ...patch } : s) }));

  const addPosToStep = (i: number, pid: number) =>
    updateStep(i, { positionIds: [...(ruleForm.steps[i]?.positionIds ?? []), pid] });
  const removePosFromStep = (i: number, pid: number) =>
    updateStep(i, { positionIds: (ruleForm.steps[i]?.positionIds ?? []).filter(p => p !== pid) });

  // ── Position Authority Matrix ──────────────────────────────────────────────
  const positionMatrix = useMemo(() => {
    const map = new Map<number, { name: string; rules: string[]; maxLimit: number | null; docTypes: string[] }>();
    rules.filter(r => r.active).forEach(rule => {
      (rule.steps ?? []).forEach(step => {
        (step.positionIds ?? []).forEach(pid => {
          const pos = positions.find(p => p.positionId === pid);
          if (!pos) return;
          const entry = map.get(pid) ?? { name: pos.positionName, rules: [] as string[], maxLimit: undefined as any, docTypes: [] as string[] };
          if (!entry.rules.includes(rule.name)) entry.rules.push(rule.name);
          if (step.approvalLimitAmount != null) {
            entry.maxLimit = entry.maxLimit == null ? step.approvalLimitAmount : Math.max(entry.maxLimit, step.approvalLimitAmount);
          } else {
            entry.maxLimit = null; // unlimited
          }
          rule.documentTypes.forEach(dt => {
            const label = DOC_TYPES.find(d => d.type === dt)?.short ?? dt;
            if (!entry.docTypes.includes(label)) entry.docTypes.push(label);
          });
          map.set(pid, entry);
        });
      });
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [rules, positions]);

  // ── Condition value input ──────────────────────────────────────────────────
  const renderCondValue = (cond: ConditionRow, idx: number) => {
    if (cond.operator === 'BETWEEN') return (
      <>
        <input type="number" className="input-field w-28 text-sm" placeholder="From"
          value={cond.value} onChange={e => updateCondition(idx, { value: e.target.value })} />
        <span className="text-xs text-gray-400 px-1">and</span>
        <input type="number" className="input-field w-28 text-sm" placeholder="To"
          value={cond.valueTo} onChange={e => updateCondition(idx, { valueTo: e.target.value })} />
      </>
    );
    if (cond.field === 'SPEND_AMOUNT') return (
      <input type="number" className="input-field w-36 text-sm" placeholder="e.g. 10000"
        value={cond.value} onChange={e => updateCondition(idx, { value: e.target.value })} />
    );
    if (cond.field === 'PO_TYPE') return (
      <select className="input-field text-sm" value={cond.value}
        onChange={e => updateCondition(idx, { value: e.target.value })}>
        <option value="">— select type —</option>
        {DOC_TYPES.filter(d => d.type.startsWith('PO_')).map(d => (
          <option key={d.type} value={d.type}>{d.label}</option>
        ))}
      </select>
    );
    if (cond.field === 'DEPARTMENT') return (
      <select className="input-field text-sm" value={cond.value}
        onChange={e => updateCondition(idx, { value: e.target.value })}>
        <option value="">— select org unit —</option>
        {orgUnits.map(u => <option key={u.orgUnitId} value={String(u.orgUnitId)}>{u.unitName}</option>)}
      </select>
    );
    return (
      <input type="text" className="input-field w-40 text-sm"
        placeholder={
          cond.field === 'GL_ACCOUNT'  ? 'e.g. 6100 or 61*'  :
          cond.field === 'VENDOR'      ? 'Vendor name'        :
          cond.field === 'COST_CENTER' ? 'e.g. CC-100'        :
          cond.field === 'CATEGORY'    ? 'e.g. Stationery'    : 'Value'
        }
        value={cond.value} onChange={e => updateCondition(idx, { value: e.target.value })} />
    );
  };

  if (authLoading || !isAdmin) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Engine</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Organisation-wide approval rules for requisitions and purchase orders — configurable by spend, PO type, department, GL account, and more.
        </p>
      </div>

      {/* ── Policy status card ── */}
      <div className="card p-5 mb-6">
        {policyLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading policy…
          </div>
        ) : !policy ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">No approval policy configured</p>
                <p className="text-xs text-amber-600 mt-0.5">Create the organisation's policy first — rules and position assignments live inside it.</p>
              </div>
            </div>
            <button onClick={openPolicyModal} className="btn-primary flex items-center gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" /> Create Policy
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <GitMerge className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{policy.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    policy.status === 'ACTIVE'   ? 'bg-green-100 text-green-700' :
                    policy.status === 'DRAFT'    ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{policy.status}</span>
                </div>
                {policy.description && <p className="text-xs text-gray-400 mt-0.5">{policy.description}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {rules.length} rule{rules.length !== 1 ? 's' : ''} · {rules.filter(r => r.active).length} active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {policy.status === 'DRAFT' && (
                <button onClick={activatePolicy}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Zap className="w-3.5 h-3.5" /> Activate Policy
                </button>
              )}
              {policy.status === 'ACTIVE' && (
                <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg font-medium">Live</span>
              )}
              <button onClick={openPolicyModal}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar + content (only when policy exists) ── */}
      {policy && (
        <>
          <div className="flex border-b border-gray-200 mb-6 -mt-2">
            {([
              { key: 'rules',  label: 'Approval Rules',   icon: Filter },
              { key: 'matrix', label: 'Position Authority', icon: Shield },
            ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* ════════════ RULES TAB ════════════ */}
          {tab === 'rules' && (
            <div>
              <div className="flex items-start justify-between mb-5 gap-4">
                <p className="text-sm text-gray-500">
                  Rules are evaluated in <strong>priority order</strong> (top → bottom).
                  The first rule that matches a document wins, unless "Continue evaluation" is set on that rule.
                </p>
                <button onClick={openCreateRule} className="btn-primary flex items-center gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
              </div>

              {rulesLoading ? (
                <div className="card p-10 flex items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading rules…
                </div>
              ) : rules.length === 0 ? (
                <div className="card p-12 text-center">
                  <Filter className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No rules yet</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">Add rules to define who approves what, and under which conditions.</p>
                  <button onClick={openCreateRule} className="btn-primary flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" /> Add First Rule
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule, idx) => (
                    <div key={rule.id}
                      className={`card p-4 flex items-start gap-4 ${!rule.active ? 'opacity-60' : ''}`}>

                      {/* Priority reorder */}
                      <div className="flex flex-col items-center pt-1 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-300 mb-1">#{idx + 1}</span>
                        <button onClick={() => moveRule(idx, -1)} disabled={idx === 0}
                          className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-20 text-gray-400">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveRule(idx, 1)} disabled={idx === rules.length - 1}
                          className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-20 text-gray-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Rule details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{rule.name}</span>
                          {rule.stopOnMatch
                            ? <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">stop on match</span>
                            : <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">continue eval</span>
                          }
                        </div>
                        {rule.description && <p className="text-xs text-gray-400 mb-2">{rule.description}</p>}

                        {/* Document types */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="text-xs text-gray-400 mr-0.5">Applies to:</span>
                          {rule.documentTypes.map(dt => (
                            <span key={dt} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                              {DOC_TYPES.find(d => d.type === dt)?.short ?? dt}
                            </span>
                          ))}
                        </div>

                        {/* Conditions */}
                        {(rule.conditions ?? []).length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className="text-xs text-gray-400 mr-0.5">When:</span>
                            {rule.conditions.map((c, ci) => (
                              <span key={ci} className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-100">
                                {COND_FIELDS.find(f => f.value === c.field)?.label}
                                {' '}{OPS_BY_FIELD[c.field]?.find(o => o.value === c.operator)?.label}
                                {' '}<strong>{c.operator === 'BETWEEN' ? `${c.value} – ${c.valueTo}` : c.value}</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Steps chain */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-gray-400 mr-0.5">Chain:</span>
                          {(rule.steps ?? []).length === 0
                            ? <span className="text-xs text-red-400 font-medium">No steps — documents won't be routed</span>
                            : (rule.steps ?? []).map((s, si) => {
                              const posNames = (s.positionIds ?? [])
                                .map(pid => positions.find(p => p.positionId === pid)?.positionName ?? `Pos ${pid}`)
                                .join(', ');
                              const label = s.label || s.stepType.replace(/_/g, ' ');
                              return (
                                <span key={si} className="flex items-center gap-1">
                                  <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100">
                                    {si + 1}. {label}{posNames ? ` · ${posNames}` : ''}
                                    {s.approvalLimitAmount != null && ` · up to ${s.approvalLimitAmount.toLocaleString()}`}
                                  </span>
                                  {si < (rule.steps ?? []).length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                                </span>
                              );
                            })
                          }
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleRule(rule)} title={rule.active ? 'Disable rule' : 'Enable rule'}
                          className={`p-1.5 rounded ${rule.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                          {rule.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => openEditRule(rule)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => rule.id && deleteRule(rule.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════ POSITION MATRIX TAB ════════════ */}
          {tab === 'matrix' && (
            <div>
              <p className="text-sm text-gray-500 mb-5">
                Approval authority derived from all <strong>active</strong> rules.
                Positions marked <em>Unlimited</em> have no spend cap configured in any step.
              </p>
              {positionMatrix.length === 0 ? (
                <div className="card p-12 text-center">
                  <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No positions assigned to rules yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add positions to approval steps in your rules — they will appear here with their derived authority.
                  </p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Position','Approval Limit','Document Types','Rules'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {positionMatrix.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                          <td className="px-4 py-3">
                            {row.maxLimit == null
                              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Unlimited</span>
                              : <span className="font-mono text-sm text-gray-700">Up to {row.maxLimit.toLocaleString()}</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {row.docTypes.map(dt => (
                                <span key={dt} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{dt}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{row.rules.join(' · ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════ POLICY MODAL ════════════ */}
      {showPolicyModal && (
        <Modal
          title={policy ? 'Edit Approval Policy' : 'Create Approval Policy'}
          subtitle="One active policy per organisation — rules live inside it"
          onClose={() => setShowPolicyModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name *</label>
              <input className="input-field" placeholder="e.g. Standard Procurement Approval Policy"
                value={policyForm.name}
                onChange={e => setPolicyForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field resize-none" rows={2}
                placeholder="Briefly describe this policy's scope and purpose"
                value={policyForm.description}
                onChange={e => setPolicyForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowPolicyModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={savePolicy} disabled={policyPending || !policyForm.name}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {policyPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {policy ? 'Update Policy' : 'Create Policy'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ════════════ RULE MODAL ════════════ */}
      {showRuleModal && (
        <Modal
          title={isRuleEdit ? 'Edit Approval Rule' : 'New Approval Rule'}
          subtitle="Define which documents this rule matches, and the approval chain to apply"
          size="xl"
          onClose={() => setShowRuleModal(false)}
        >
          <div className="space-y-7">

            {/* ── Section 1: Identity ── */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Rule Details</p>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                  <input className="input-field" placeholder="e.g. High Value Purchase Orders"
                    value={ruleForm.name}
                    onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input className="input-field" placeholder="Optional — shown in rule list"
                    value={ruleForm.description}
                    onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={ruleForm.active}
                    onChange={e => setRuleForm(f => ({ ...f, active: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Rule Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={ruleForm.stopOnMatch}
                    onChange={e => setRuleForm(f => ({ ...f, stopOnMatch: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Stop evaluation on first match</span>
                </label>
                {!ruleForm.stopOnMatch && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Lower-priority rules will also be evaluated
                  </span>
                )}
              </div>
            </div>

            {/* ── Section 2: Applies To ── */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Applies To — Document Types</p>
              <p className="text-xs text-gray-400 mb-3">This rule is only evaluated for the selected document types.</p>
              <div className="flex flex-wrap gap-2">
                {DOC_TYPES.map(({ type, label }) => (
                  <button key={type} onClick={() => toggleDocType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      ruleForm.documentTypes.includes(type)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {ruleForm.documentTypes.length === 0 && (
                <p className="text-xs text-red-500 mt-1.5">Select at least one document type.</p>
              )}
            </div>

            {/* ── Section 3: Conditions ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conditions</p>
                  <p className="text-xs text-gray-400 mt-0.5">All conditions must match (AND). Leave empty to match every document of the selected types.</p>
                </div>
                <button onClick={addCondition}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Plus className="w-3.5 h-3.5" /> Add Condition
                </button>
              </div>

              {ruleForm.conditions.length === 0 ? (
                <div className="mt-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                  No conditions — matches all {ruleForm.documentTypes.length > 0 ? 'selected document types' : 'documents'}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {ruleForm.conditions.map((cond, idx) => (
                    <div key={cond._id} className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-xl">
                      {idx > 0 && <span className="text-xs font-semibold text-gray-400 w-6 text-center">AND</span>}
                      {idx === 0 && <span className="text-xs font-semibold text-gray-400 w-6 text-center">IF</span>}
                      <select className="input-field text-sm w-44"
                        value={cond.field}
                        onChange={e => {
                          const field = e.target.value as ApprovalConditionField;
                          updateCondition(idx, { field, operator: OPS_BY_FIELD[field][0].value, value: '', valueTo: '' });
                        }}>
                        {COND_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select className="input-field text-sm w-36"
                        value={cond.operator}
                        onChange={e => updateCondition(idx, { operator: e.target.value as ApprovalConditionOperator, value: '', valueTo: '' })}>
                        {(OPS_BY_FIELD[cond.field] ?? []).map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                      {renderCondValue(cond, idx)}
                      <button onClick={() => removeCondition(idx)}
                        className="p-1 hover:bg-red-50 rounded text-red-400 ml-auto">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 4: Approval Chain ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approval Chain</p>
                  <p className="text-xs text-gray-400 mt-0.5">Steps execute in order. Each must be completed before the next begins.</p>
                </div>
                <button onClick={addStep}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              {ruleForm.steps.length === 0 ? (
                <div className="mt-2 rounded-xl border-2 border-dashed border-red-200 bg-red-50/30 p-4 text-center text-xs text-red-400">
                  Add at least one step — without steps this rule will match documents but not route them for approval.
                </div>
              ) : (
                <div className="mt-2 space-y-3">
                  {ruleForm.steps.map((step, idx) => (
                    <div key={step._id} className="rounded-xl border-2 border-gray-200 p-4">

                      {/* Step header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <input
                          className="flex-1 text-sm font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none bg-transparent py-0.5"
                          placeholder={`Step ${idx + 1} label — e.g. "Budget Holder Approval"`}
                          value={step.label}
                          onChange={e => updateStep(idx, { label: e.target.value })}
                        />
                        <button onClick={() => removeStep(idx)} className="p-1 hover:bg-red-50 rounded text-red-400 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Approver type */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Approver Type</label>
                          <select className="input-field text-sm" value={step.stepType}
                            onChange={e => updateStep(idx, { stepType: e.target.value as ApprovalStepType, positionIds: [] })}>
                            <option value="POSITION">Position</option>
                            <option value="DIRECT_MANAGER">Direct Manager</option>
                            <option value="SPECIFIC_PERSON">Specific Person</option>
                          </select>
                        </div>

                        {/* Approval mode */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Approval Mode</label>
                          <select className="input-field text-sm" value={step.approvalMode}
                            onChange={e => updateStep(idx, { approvalMode: e.target.value as ApprovalMode })}>
                            <option value="ANY_ONE">Any one approves</option>
                            <option value="ALL">All must approve</option>
                            <option value="MAJORITY">Majority vote</option>
                          </select>
                        </div>

                        {/* Spend authority cap */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Approval Limit</label>
                          <input type="number" className="input-field text-sm"
                            placeholder="blank = unlimited"
                            value={step.approvalLimitAmount}
                            onChange={e => updateStep(idx, { approvalLimitAmount: e.target.value })} />
                        </div>

                        {/* Position selector */}
                        {step.stepType === 'POSITION' && (
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Positions Assigned</label>
                            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                              {step.positionIds.map(pid => {
                                const pos = positions.find(p => p.positionId === pid);
                                return (
                                  <span key={pid} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                    {pos?.positionName ?? `Position ${pid}`}
                                    <button onClick={() => removePosFromStep(idx, pid)} className="hover:text-red-600 leading-none">&times;</button>
                                  </span>
                                );
                              })}
                              {step.positionIds.length === 0 && (
                                <span className="text-xs text-red-400">No positions assigned yet</span>
                              )}
                            </div>
                            <select className="input-field text-sm" value=""
                              onChange={e => {
                                const v = Number(e.target.value);
                                if (v && !step.positionIds.includes(v)) addPosToStep(idx, v);
                              }}>
                              <option value="">+ Add a position…</option>
                              {positions
                                .filter(p => !step.positionIds.includes(p.positionId))
                                .map(p => <option key={p.positionId} value={p.positionId}>{p.positionName}</option>)
                              }
                            </select>
                          </div>
                        )}

                        {step.stepType === 'DIRECT_MANAGER' && (
                          <div className="col-span-3">
                            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg p-3">
                              <Info className="w-3.5 h-3.5 flex-shrink-0" />
                              The submitting person's direct manager (set on their Person record) is resolved automatically at runtime.
                            </div>
                          </div>
                        )}

                        {step.stepType === 'SPECIFIC_PERSON' && (
                          <div className="col-span-3">
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-3">
                              <Info className="w-3.5 h-3.5 flex-shrink-0" />
                              Named-person assignment is configured via the Persons module once this rule is saved.
                            </div>
                          </div>
                        )}

                        {/* Timeout */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Timeout (hours)</label>
                          <input type="number" className="input-field text-sm" placeholder="48"
                            value={step.timeoutHours}
                            onChange={e => updateStep(idx, { timeoutHours: e.target.value })} />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">On Timeout</label>
                          <select className="input-field text-sm" value={step.onTimeout}
                            onChange={e => updateStep(idx, { onTimeout: e.target.value as ApprovalTimeout })}>
                            <option value="ESCALATE">Escalate to next step</option>
                            <option value="AUTO_APPROVE">Auto-approve</option>
                            <option value="AUTO_REJECT">Auto-reject</option>
                            <option value="REMIND">Send reminder only</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setShowRuleModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveRule}
                disabled={ruleSaving || !ruleForm.name || ruleForm.documentTypes.length === 0 || ruleForm.steps.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {ruleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isRuleEdit ? 'Update Rule' : 'Create Rule'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
