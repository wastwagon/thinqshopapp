/** Brand-aligned badge for in-progress / active pipeline states */
export const STATUS_PROGRESS_BADGE =
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200';

/** Stronger variant for customer-facing track / status chips */
export const STATUS_PROGRESS_BADGE_STRONG =
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-blue-100 text-blue-700 border-blue-300';

/** Admin stat card accent for pipeline / in-flight metrics */
export const ADMIN_STAT_PROGRESS = {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
} as const;

/** Admin stat card accent for logistics / freight (neutral, not indigo) */
export const ADMIN_STAT_LOGISTICS = {
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
} as const;

/** Audit log field patch highlight */
export const AUDIT_PATCH_BADGE =
    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200';
