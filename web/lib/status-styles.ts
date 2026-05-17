/** Brand-aligned badge for in-progress / active pipeline states */
export const STATUS_PROGRESS_BADGE = 'bg-brand/10 text-brand border border-brand/20';

/** Stronger variant for customer-facing track / status chips */
export const STATUS_PROGRESS_BADGE_STRONG = 'bg-brand-muted text-brand border border-brand/30';

/** Admin stat card accent for pipeline / in-flight metrics */
export const ADMIN_STAT_PROGRESS = {
    color: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/20',
} as const;

/** Admin stat card accent for logistics / freight (neutral, not indigo) */
export const ADMIN_STAT_LOGISTICS = {
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
} as const;

/** Audit log field patch highlight */
export const AUDIT_PATCH_BADGE = 'px-2 py-0.5 rounded-md bg-brand/10 text-brand font-semibold';
