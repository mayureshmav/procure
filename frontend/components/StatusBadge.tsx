'use client';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  // Vendor
  ACTIVE:             { bg: 'bg-success-100', text: 'text-success-700', label: 'Active' },
  INACTIVE:           { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Inactive' },
  // REQ
  DRAFT:              { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Draft' },
  SUBMITTED:          { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Submitted' },
  APPROVED:           { bg: 'bg-success-100', text: 'text-success-700', label: 'Approved' },
  REJECTED:           { bg: 'bg-error-100',   text: 'text-error-700',   label: 'Rejected' },
  CONVERTED:          { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Converted' },
  // PO
  ACKNOWLEDGED:       { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Acknowledged' },
  PARTIALLY_RECEIVED: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Partial Recv.' },
  RECEIVED:           { bg: 'bg-success-100', text: 'text-success-700', label: 'Received' },
  CLOSED:             { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'Closed' },
  CANCELLED:          { bg: 'bg-error-100',   text: 'text-error-700',   label: 'Cancelled' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { bg: 'bg-neutral-100', text: 'text-neutral-700', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
