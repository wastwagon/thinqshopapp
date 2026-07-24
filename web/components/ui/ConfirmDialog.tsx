'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

type ConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    loading?: boolean;
};

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={loading ? () => undefined : onClose}
            title={title}
            description={description}
            size="sm"
            showClose={!loading}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        loading={loading}
                        onClick={() => void onConfirm()}
                        className="w-full sm:w-auto"
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        />
    );
}
