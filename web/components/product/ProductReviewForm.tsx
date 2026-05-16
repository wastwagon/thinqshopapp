'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

type ProductReviewFormProps = {
    productId: number;
    productSlug?: string;
    onSubmitted?: () => void;
};

export default function ProductReviewForm({ productId, productSlug, onSubmitted }: ProductReviewFormProps) {
    const { isAuthenticated, user } = useAuth();
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isAuthenticated) {
        return (
            <p className="text-sm text-gray-600">
                <Link
                    href={`/login?redirect=${encodeURIComponent(productSlug ? `/products/${productSlug}` : '/shop')}`}
                    className="text-brand font-medium hover:underline"
                >
                    Sign in
                </Link>{' '}
                to write a review.
            </p>
        );
    }

    if (submitted) {
        return (
            <p className="text-sm text-gray-600 bg-brand/5 border border-brand/20 rounded-xl px-4 py-3">
                Thanks for your review. It will appear after our team approves it.
            </p>
        );
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
            await api.post(`/products/${productId}/reviews`, {
                rating,
                review_text: reviewText.trim() || undefined,
                display_name: displayName || undefined,
            });
            setSubmitted(true);
            toast.success('Review submitted for approval');
            onSubmitted?.();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            const text = Array.isArray(message) ? message[0] : message;
            toast.error(text || 'Could not submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flat-card p-4 sm:p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Write a review</p>
            <div className="flex items-center gap-1" role="group" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
                        aria-label={`${value} star${value > 1 ? 's' : ''}`}
                    >
                        <Star
                            className={`h-6 w-6 ${
                                value <= (hoverRating || rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'
                            }`}
                        />
                    </button>
                ))}
            </div>
            <div>
                <label htmlFor="review-text" className="sr-only">
                    Review
                </label>
                <textarea
                    id="review-text"
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product (optional)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-y min-h-[88px]"
                />
            </div>
            <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
                {submitting ? 'Submitting…' : 'Submit review'}
            </button>
        </form>
    );
}
