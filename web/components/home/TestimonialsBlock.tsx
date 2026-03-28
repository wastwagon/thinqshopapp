'use client';

import { Quote } from 'lucide-react';

type Testimonial = {
    id: number;
    quote: string;
    author_name: string;
    author_role?: string | null;
    avatar_path?: string | null;
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
    { id: 1, quote: 'ThinQShop delivered my camera in two days. Packaging was perfect and the team answered every question.', author_name: 'Akua B.', author_role: 'Videographer' },
    { id: 2, quote: 'Finally a place that stocks pro gear in Ghana. Prices are fair and the logistics are reliable.', author_name: 'Kofi M.', author_role: 'Content Creator' },
    { id: 3, quote: "I've ordered twice — laptops and accessories. Both times smooth and on time.", author_name: 'Ama S.', author_role: 'Photographer' },
];

export default function TestimonialsBlock({ testimonials }: { testimonials: Testimonial[] }) {
    const list = testimonials?.length ? testimonials : FALLBACK_TESTIMONIALS;
    if (!list.length) return null;
    return (
        <section className="py-8 sm:py-12 border-y border-gray-100/90 bg-gradient-to-b from-orange-50/60 via-white to-white" aria-label="Testimonials">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 tracking-tight">What our customers say</h2>
                <p className="text-xs text-gray-500 mb-6">Real feedback from creators and professionals</p>
                {/* Mobile: single column, touch-friendly cards. Desktop: grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {list.slice(0, 6).map((t) => (
                        <blockquote
                            key={t.id}
                            className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100/90 shadow-sm hover:shadow-md hover:border-brand/15 transition-shadow min-h-[120px] flex flex-col"
                        >
                            <Quote className="w-8 h-8 text-brand/35 mb-2 flex-shrink-0" aria-hidden />
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                            <footer className="mt-3 text-xs font-semibold text-gray-900">
                                — {t.author_name}
                                {t.author_role && <span className="font-normal text-gray-500">, {t.author_role}</span>}
                            </footer>
                        </blockquote>
                    ))}
                </div>
            </div>
        </section>
    );
}
