'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';
import ProductImage from './ProductImage';
import PriceDisplay from './PriceDisplay';

type ProductImageLightboxProps = {
    open: boolean;
    onClose: () => void;
    images: string[];
    title: string;
    productHref?: string;
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    /** Express checkout — add to cart and go to checkout */
    onBuy?: () => void | Promise<void>;
    buyDisabled?: boolean;
    buyLabel?: string;
    buying?: boolean;
    priceGhs?: number;
    categoryLabel?: string;
    rating?: number;
    description?: string | null;
};

export default function ProductImageLightbox({
    open,
    onClose,
    images,
    title,
    productHref,
    initialIndex = 0,
    onIndexChange,
    onBuy,
    buyDisabled = false,
    buyLabel = 'Buy',
    buying = false,
    priceGhs,
    categoryLabel,
    rating,
    description,
}: ProductImageLightboxProps) {
    const [index, setIndex] = useState(initialIndex);
    const count = images.length;
    const hasMultiple = count > 1;
    const hasDetails =
        priceGhs != null ||
        Boolean(categoryLabel) ||
        rating != null ||
        Boolean(description);

    useEffect(() => {
        if (open) setIndex(Math.min(initialIndex, Math.max(0, count - 1)));
    }, [open, initialIndex, count]);

    const goPrev = useCallback(() => {
        setIndex((i) => {
            const next = i <= 0 ? count - 1 : i - 1;
            onIndexChange?.(next);
            return next;
        });
    }, [count, onIndexChange]);

    const goNext = useCallback(() => {
        setIndex((i) => {
            const next = i >= count - 1 ? 0 : i + 1;
            onIndexChange?.(next);
            return next;
        });
    }, [count, onIndexChange]);

    const selectIndex = useCallback(
        (i: number) => {
            setIndex(i);
            onIndexChange?.(i);
        },
        [onIndexChange],
    );

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && hasMultiple) goPrev();
            if (e.key === 'ArrowRight' && hasMultiple) goNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, hasMultiple, goPrev, goNext, onClose]);

    const currentSrc = images[index] ?? images[0] ?? '';

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[200]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm" aria-hidden />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="relative w-full max-w-3xl max-h-[min(92vh,880px)] flex flex-col my-auto">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                    <Dialog.Title className="text-sm sm:text-base font-semibold text-gray-900 truncate pr-2">
                                        {title}
                                    </Dialog.Title>
                                    {hasMultiple && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {index + 1} of {count}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="shrink-0 min-w-[44px] min-h-[44px] w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
                                    aria-label="Close image viewer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative flex-1 min-h-0 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm overflow-hidden">
                                <div className="relative aspect-square sm:aspect-[4/3] w-full max-h-[min(55vh,560px)] bg-white flex items-center justify-center p-4 sm:p-8">
                                    {currentSrc ? (
                                        <ProductImage
                                            src={currentSrc}
                                            alt={title}
                                            width={900}
                                            height={900}
                                            className="object-contain max-h-full w-full h-full"
                                        />
                                    ) : null}
                                </div>

                                {hasMultiple && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={goPrev}
                                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {hasMultiple && (
                                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar justify-center px-1">
                                    {images.map((src, i) => (
                                        <button
                                            key={`${src}-${i}`}
                                            type="button"
                                            onClick={() => selectIndex(i)}
                                            className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                                                i === index
                                                    ? 'border-blue-500 ring-2 ring-blue-100'
                                                    : 'border-gray-200 opacity-80 hover:opacity-100'
                                            }`}
                                            aria-label={`View image ${i + 1}`}
                                        >
                                            <ProductImage
                                                src={src}
                                                alt=""
                                                width={56}
                                                height={56}
                                                className="object-cover w-full h-full"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {hasDetails && (
                                <div className="mt-4 px-1 space-y-2">
                                    {(categoryLabel || rating != null) && (
                                        <div className="flex items-center justify-between gap-2">
                                            {categoryLabel ? (
                                                <span className="text-xs font-medium text-blue-600 truncate">
                                                    {categoryLabel}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            {rating != null && (
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-xs text-gray-500">{rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {priceGhs != null && Number.isFinite(priceGhs) && (
                                        <PriceDisplay
                                            amountGhs={priceGhs}
                                            className="text-base font-semibold text-gray-900"
                                        />
                                    )}
                                    {description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {(onBuy || productHref) && (
                                <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 px-1">
                                    {onBuy && (
                                        <button
                                            type="button"
                                            onClick={() => void onBuy()}
                                            disabled={buyDisabled || buying}
                                            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                                            {buying ? 'Buying…' : buyLabel}
                                        </button>
                                    )}
                                    {productHref && (
                                        <Link
                                            href={productHref}
                                            onClick={onClose}
                                            className={`inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                                onBuy
                                                    ? 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            View product details
                                        </Link>
                                    )}
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

/** Tap hint overlay for product card image areas */
export function ProductImageTapHint() {
    return (
        <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/45 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover/image:opacity-100 transition-opacity md:flex hidden">
            <ZoomIn className="h-3 w-3" aria-hidden />
            Tap to expand
        </span>
    );
}
