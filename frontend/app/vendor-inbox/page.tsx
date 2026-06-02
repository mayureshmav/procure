'use client';

import { useEffect, useState, useCallback } from 'react';
import { getVendorInbox, markInboxRead, acknowledgeInboxPo } from '@/lib/api';
import { VendorInboxMessage, VendorInboxStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Inbox, Mail, MailOpen, CheckCircle, Clock, RefreshCw,
  ShoppingCart, FileText, XCircle, AlertCircle, Eye,
  Building2, Filter,
} from 'lucide-react';

const STATUS_CONFIG: Record<VendorInboxStatus, { label: string; cls: string; icon: React.ElementType }> = {
  UNREAD:       { label: 'Unread',       cls: 'bg-blue-100 text-blue-700',   icon: Mail        },
  READ:         { label: 'Read',         cls: 'bg-gray-100 text-gray-600',   icon: MailOpen    },
  ACKNOWLEDGED: { label: 'Acknowledged', cls: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  PURCHASE_ORDER: { label: 'Purchase Order', cls: 'bg-primary-50 text-primary-700' },
  AMENDMENT:      { label: 'Amendment',      cls: 'bg-amber-50 text-amber-700'    },
  CANCELLATION:   { label: 'Cancellation',   cls: 'bg-red-50 text-red-600'        },
};

export default function VendorInboxPage() {
  const { user } = useAuth();
  const isVendorUser = user?.role === 'VENDOR_USER' || user?.role === 'VENDOR_ADMIN';

  const [messages, setMessages]     = useState<VendorInboxMessage[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<VendorInboxStatus | ''>('');
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [acting, setActing]         = useState<string | null>(null);
  const [selected, setSelected]     = useState<VendorInboxMessage | null>(null);

  const load = useCallback((p = 0) => {
    setLoading(true);
    getVendorInbox({ status: filter || undefined, page: p, size: 20 })
      .then((r: any) => {
        setMessages(r.content ?? r ?? []);
        setTotalPages(r.totalPages ?? 1);
        setPage(p);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(0); }, [load]);

  const handleOpen = async (msg: VendorInboxMessage) => {
    setSelected(msg);
    if (msg.status === 'UNREAD') {
      await markInboxRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'READ' } : m));
    }
  };

  const handleAcknowledge = async (id: string) => {
    setActing(id);
    try {
      await acknowledgeInboxPo(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'ACKNOWLEDGED' } : m));
      if (selected?.id === id) setSelected(s => s ? { ...s, status: 'ACKNOWLEDGED' } : s);
    } finally { setActing(null); }
  };

  const unreadCount = messages.filter(m => m.status === 'UNREAD').length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-neutral-900">PO Inbox</h1>
            {unreadCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-neutral-500 text-sm">
            {isVendorUser
              ? `Purchase Orders addressed to ${user?.vendorName ?? 'your company'}`
              : 'Purchase Orders delivered to vendor portals'}
          </p>
        </div>
        <button onClick={() => load(page)}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-neutral-400" />
        <div className="flex gap-2">
          {([
            { value: '',             label: 'All'          },
            { value: 'UNREAD',       label: 'Unread'       },
            { value: 'READ',         label: 'Read'         },
            { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
          ] as { value: VendorInboxStatus | ''; label: string }[]).map(({ value, label }) => (
            <button key={value} onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-260px)]">
        {/* Message list */}
        <div className="w-96 flex-shrink-0 flex flex-col border border-neutral-200 rounded-xl overflow-hidden bg-white">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-6">
              <Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No messages found.</p>
              {!isVendorUser && (
                <p className="text-xs mt-1 text-center">Send a PO to a vendor with portal delivery enabled to see it here.</p>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
              {messages.map(msg => {
                const StatusIcon = STATUS_CONFIG[msg.status]?.icon ?? Mail;
                const isSelected = selected?.id === msg.id;
                return (
                  <button key={msg.id} onClick={() => handleOpen(msg)}
                    className={`w-full text-left px-4 py-3.5 transition-colors ${
                      isSelected ? 'bg-primary-50' : 'hover:bg-neutral-50'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                        msg.status === 'UNREAD' ? 'bg-blue-100' : 'bg-neutral-100'
                      }`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${msg.status === 'UNREAD' ? 'text-blue-600' : 'text-neutral-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-sm truncate ${msg.status === 'UNREAD' ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                            {msg.subject}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {msg.poNumber && (
                            <span className="text-xs font-mono text-neutral-500">{msg.poNumber}</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_CONFIG[msg.type]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                            {TYPE_CONFIG[msg.type]?.label ?? msg.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-neutral-400">
                            {new Date(msg.sentAt).toLocaleDateString()}
                          </span>
                          {msg.totalAmount != null && (
                            <span className="text-xs font-semibold text-neutral-700">
                              {msg.currency ?? ''} {msg.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-100 bg-neutral-25">
              <button disabled={page === 0} onClick={() => load(page - 1)}
                className="text-xs px-2 py-1 border rounded disabled:opacity-40 hover:bg-neutral-50">← Prev</button>
              <span className="text-xs text-neutral-500">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)}
                className="text-xs px-2 py-1 border rounded disabled:opacity-40 hover:bg-neutral-50">Next →</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-1 border border-neutral-200 rounded-xl overflow-hidden bg-white">
          {selected ? (
            <div className="flex flex-col h-full">
              {/* Detail header */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-25">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">{selected.subject}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {selected.poNumber && (
                        <span className="text-sm font-mono text-neutral-600">{selected.poNumber}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[selected.status]?.cls}`}>
                        {STATUS_CONFIG[selected.status]?.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_CONFIG[selected.type]?.cls ?? ''}`}>
                        {TYPE_CONFIG[selected.type]?.label ?? selected.type}
                      </span>
                    </div>
                  </div>
                  {selected.status !== 'ACKNOWLEDGED' && isVendorUser && (
                    <button
                      onClick={() => handleAcknowledge(selected.id)}
                      disabled={acting === selected.id}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {acting === selected.id
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <CheckCircle className="w-4 h-4" />}
                      Acknowledge Receipt
                    </button>
                  )}
                </div>
              </div>

              {/* Detail body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Vendor', value: selected.vendorName, icon: Building2 },
                    { label: 'PO Number', value: selected.poNumber ?? '—', icon: FileText },
                    { label: 'Line Items', value: selected.lineCount != null ? String(selected.lineCount) : '—', icon: ShoppingCart },
                    { label: 'Total Value', value: selected.totalAmount != null ? `${selected.currency ?? ''} ${selected.totalAmount.toLocaleString()}` : '—', icon: CheckCircle },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5 text-neutral-400" />
                        <p className="text-xs text-neutral-500">{label}</p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-800 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Activity</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="text-neutral-600">Sent on <strong>{new Date(selected.sentAt).toLocaleString()}</strong></span>
                    </div>
                    {selected.readAt && (
                      <div className="flex items-center gap-3 text-sm">
                        <Eye className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-neutral-600">Opened on <strong>{new Date(selected.readAt).toLocaleString()}</strong></span>
                      </div>
                    )}
                    {selected.acknowledgedAt && (
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-neutral-600">Acknowledged on <strong>{new Date(selected.acknowledgedAt).toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Channels */}
                {selected.deliveryChannels && selected.deliveryChannels.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Delivery Channels</p>
                    <div className="flex gap-2 flex-wrap">
                      {selected.deliveryChannels.map(ch => (
                        <span key={ch} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">{ch}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-6">
              <MailOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
