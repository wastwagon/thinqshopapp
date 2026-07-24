'use client';

import { useCallback, useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export type ConfirmOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
};

/**
 * Promise-based confirm for replacing `window.confirm`.
 * Usage: `if (!(await confirm({ title: 'Delete?' }))) return;`
 */
export function useConfirmDialog() {
    const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({ ...opts, resolve });
        });
    }, []);

    const close = (ok: boolean) => {
        state?.resolve(ok);
        setState(null);
    };

    const confirmDialog = (
        <ConfirmDialog
            open={!!state}
            onClose={() => close(false)}
            onConfirm={() => close(true)}
            title={state?.title ?? ''}
            description={state?.description}
            confirmLabel={state?.confirmLabel ?? 'Confirm'}
            cancelLabel={state?.cancelLabel ?? 'Cancel'}
            variant={state?.variant ?? 'danger'}
        />
    );

    return { confirm, confirmDialog };
}
