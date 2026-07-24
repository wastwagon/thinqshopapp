'use client';

import { Fragment, type MutableRefObject, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
};

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
    /** Extra classes on the panel (e.g. padding overrides) */
    className?: string;
    showClose?: boolean;
    initialFocus?: MutableRefObject<HTMLElement | null>;
};

export default function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    className,
    showClose = true,
    initialFocus,
}: ModalProps) {
    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose} initialFocus={initialFocus}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 transition-opacity" aria-hidden />
                </Transition.Child>

                <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain">
                    <div className="flex min-h-full items-end sm:items-center justify-center p-4 sm:p-6">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel
                                className={cn(
                                    'admin-modal-panel relative w-full p-5 sm:p-6',
                                    sizeClasses[size],
                                    className
                                )}
                            >
                                {(title || showClose) && (
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="min-w-0">
                                            {title && (
                                                <Dialog.Title className="text-lg font-bold text-gray-900 tracking-tight">
                                                    {title}
                                                </Dialog.Title>
                                            )}
                                            {description && (
                                                <Dialog.Description className="text-sm text-gray-500 mt-1">
                                                    {description}
                                                </Dialog.Description>
                                            )}
                                        </div>
                                        {showClose && (
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="min-w-[44px] min-h-[44px] -mr-1 -mt-1 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 shrink-0"
                                                aria-label="Close"
                                            >
                                                <X className="h-5 w-5" aria-hidden />
                                            </button>
                                        )}
                                    </div>
                                )}
                                {children}
                                {footer && (
                                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                        {footer}
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
