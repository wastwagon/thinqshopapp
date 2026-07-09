/** Brand-aligned badge for in-progress / active pipeline states */
export const STATUS_PROGRESS_BADGE = 'bg-blue-50 text-blue-600 border border-blue-200';

/** Stronger variant for customer-facing track / status chips */
export const STATUS_PROGRESS_BADGE_STRONG = 'bg-blue-100 text-blue-700 border border-blue-300';

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
export const AUDIT_PATCH_BADGE = 'px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold';
