'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Layout,
    ChevronDown,
    ChevronUp,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Save,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type HeroSlide = { id: number; title: string; subtitle?: string | null; cta_text?: string | null; cta_url?: string | null; image_path?: string | null; sort_order: number; is_active: boolean };
type TrustBadge = { id: number; icon: string; label: string; optional_link?: string | null; sort_order: number; is_active: boolean };
type Testimonial = { id: number; quote: string; author_name: string; author_role?: string | null; avatar_path?: string | null; sort_order: number; is_active: boolean };
type Policy = { id: number; type: string; short_text?: string | null; full_text?: string | null };
type HomepageSection = { id: number; section_key: string; sort_order: number; is_enabled: boolean };

export default function AdminContent() {
    const [loading, setLoading] = useState(true);
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [trustBadges, setTrustBadges] = useState<TrustBadge[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [openSection, setOpenSection] = useState<string | null>('hero');
    const [saving, setSaving] = useState<string | null>(null);

    const load = async () => {
        try {
            const [h, t, tb, p, s] = await Promise.all([
                api.get('/content/admin/hero-slides'),
                api.get('/content/admin/testimonials'),
                api.get('/content/admin/trust-badges'),
                api.get('/content/admin/policies'),
                api.get('/content/admin/homepage-sections'),
            ]);
            setHeroSlides(h.data ?? []);
            setTestimonials(t.data ?? []);
            setTrustBadges(tb.data ?? []);
            setPolicies(p.data ?? []);
            setSections(s.data ?? []);
        } catch {
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const updatePolicy = async (type: string, payload: { short_text?: string; full_text?: string }) => {
        setSaving(type);
        try {
            await api.patch(`/content/admin/policies/${type}`, payload);
            toast.success('Policy updated');
            load();
        } catch {
            toast.error('Failed to update policy');
        } finally {
            setSaving(null);
        }
    };

    const toggleSectionEnabled = async (sectionKey: string, is_enabled: boolean) => {
        setSaving(sectionKey);
        try {
            await api.patch(`/content/admin/homepage-sections/${sectionKey}`, { is_enabled });
            toast.success('Section updated');
            load();
        } catch {
            toast.error('Failed to update section');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-[40vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    const sectionCards = [
        { id: 'hero', title: 'Hero slides', count: heroSlides.length },
        { id: 'trust', title: 'Trust badges', count: trustBadges.length },
        { id: 'testimonials', title: 'Testimonials', count: testimonials.length },
        { id: 'policies', title: 'Delivery & returns', count: policies.length },
        { id: 'sections', title: 'Homepage sections', count: sections.length },
    ];

    return (
        <DashboardLayout isAdmin={true}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Layout className="h-7 w-7 text-blue-600" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Content</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Hero, trust badges, testimonials, policies (mobile-first)</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {sectionCards.map(({ id, title, count }) => (
                    <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpenSection(openSection === id ? null : id)}
                            className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 text-left font-semibold text-gray-900 touch-manipulation"
                        >
                            <span>{title}</span>
                            <span className="text-sm font-normal text-gray-500">{count} items</span>
                            {openSection === id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        {openSection === id && (
                            <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                                {id === 'hero' && (
                                    <HeroSection slides={heroSlides} onReload={load} setSaving={setSaving} saving={saving} />
                                )}
                                {id === 'trust' && (
                                    <TrustSection badges={trustBadges} onReload={load} setSaving={setSaving} saving={saving} />
                                )}
                                {id === 'testimonials' && (
                                    <TestimonialsSection items={testimonials} onReload={load} setSaving={setSaving} saving={saving} />
                                )}
                                {id === 'policies' && (
                                    <PoliciesSection policies={policies} onUpdate={updatePolicy} saving={saving} />
                                )}
                                {id === 'sections' && (
                                    <SectionsList sections={sections} onToggle={toggleSectionEnabled} saving={saving} />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}

function HeroSection({
    slides,
    onReload,
    setSaving,
    saving,
}: {
    slides: HeroSlide[];
    onReload: () => void;
    setSaving: (v: string | null) => void;
    saving: string | null;
}) {
    const [editing, setEditing] = useState<HeroSlide | null>(null);
    const [form, setForm] = useState({ title: '', subtitle: '', cta_text: '', cta_url: '', is_active: true });

    const saveSlide = async () => {
        if (editing) {
            setSaving('hero');
            try {
                await api.patch(`/content/admin/hero-slides/${editing.id}`, form);
                toast.success('Slide updated');
                setEditing(null);
                onReload();
            } catch {
                toast.error('Failed to update');
            } finally {
                setSaving(null);
            }
        } else {
            setSaving('hero');
            try {
                await api.post('/content/admin/hero-slides', form);
                toast.success('Slide added');
                setForm({ title: '', subtitle: '', cta_text: '', cta_url: '', is_active: true });
                onReload();
            } catch {
                toast.error('Failed to add');
            } finally {
                setSaving(null);
            }
        }
    };

    const deleteSlide = async (id: number) => {
        if (!confirm('Delete this slide?')) return;
        setSaving('hero');
        try {
            await api.delete(`/content/admin/hero-slides/${id}`);
            toast.success('Deleted');
            setEditing(null);
            onReload();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-3 pt-3">
            {editing && editing.id === 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                    <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                    <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
                    <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="CTA text" value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} />
                    <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="CTA URL" value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} />
                    <div className="flex gap-2">
                        <button type="button" className="min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center gap-2" onClick={saveSlide} disabled={!!saving}>
                            {saving === 'hero' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                        </button>
                        <button type="button" className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-sm" onClick={() => setEditing(null)}>
                            <X className="h-4 w-4" /> Cancel
                        </button>
                    </div>
                </div>
            )}
            {slides.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    {editing?.id === s.id ? (
                        <div className="space-y-2">
                            <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                            <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
                            <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="CTA text" value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} />
                            <input className="w-full min-h-[44px] px-3 rounded-lg border text-sm" placeholder="CTA URL" value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} />
                            <div className="flex gap-2">
                                <button type="button" className="min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center gap-2" onClick={saveSlide} disabled={!!saving}>
                                    {saving === 'hero' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save
                                </button>
                                <button type="button" className="min-h-[44px] px-4 rounded-lg border border-gray-200 text-sm" onClick={() => setEditing(null)}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-medium text-gray-900">{s.title}</p>
                                {s.subtitle && <p className="text-xs text-gray-500 mt-0.5">{s.subtitle}</p>}
                            </div>
                            <div className="flex gap-1">
                                <button type="button" className="min-w-[44px] min-h-[44px] rounded-lg border border-gray-200 flex items-center justify-center" onClick={() => { setEditing(s); setForm({ title: s.title, subtitle: s.subtitle ?? '', cta_text: s.cta_text ?? '', cta_url: s.cta_url ?? '', is_active: s.is_active }); }}>
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button type="button" className="min-w-[44px] min-h-[44px] rounded-lg border border-red-100 text-red-600 flex items-center justify-center" onClick={() => deleteSlide(s.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {!editing && (
                <button
                    type="button"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 font-medium text-sm touch-manipulation"
                    onClick={() => { setEditing({ id: 0, title: '', subtitle: '', cta_text: '', cta_url: '', sort_order: 0, is_active: true } as HeroSlide); setForm({ title: '', subtitle: '', cta_text: '', cta_url: '', is_active: true }); }}
                >
                    <Plus className="h-5 w-5" /> Add slide
                </button>
            )}
        </div>
    );
}

function TrustSection({
    badges,
    onReload,
    setSaving,
    saving,
}: {
    badges: TrustBadge[];
    onReload: () => void;
    setSaving: (v: string | null) => void;
    saving: string | null;
}) {
    return (
        <div className="space-y-2 pt-3">
            {badges.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="font-medium text-gray-900">{b.label}</span>
                    <span className="text-xs text-gray-500">{b.icon}</span>
                </div>
            ))}
            <p className="text-xs text-gray-500">Edit trust badges via API or add inline edit in a follow-up.</p>
        </div>
    );
}

function TestimonialsSection({
    items,
    onReload,
    setSaving,
    saving,
}: {
    items: Testimonial[];
    onReload: () => void;
    setSaving: (v: string | null) => void;
    saving: string | null;
}) {
    return (
        <div className="space-y-2 pt-3">
            {items.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-700 line-clamp-2">"{t.quote}"</p>
                    <p className="text-xs font-medium text-gray-900 mt-1">— {t.author_name}{t.author_role ? `, ${t.author_role}` : ''}</p>
                </div>
            ))}
        </div>
    );
}

function PoliciesSection({
    policies,
    onUpdate,
    saving,
}: {
    policies: Policy[];
    onUpdate: (type: string, p: { short_text?: string; full_text?: string }) => Promise<void>;
    saving: string | null;
}) {
    const [editing, setEditing] = useState<Policy | null>(null);
    const [short, setShort] = useState('');
    const [full, setFull] = useState('');

    return (
        <div className="space-y-3 pt-3">
            {policies.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="font-medium text-gray-900 capitalize">{p.type}</p>
                    {editing?.id === p.id ? (
                        <div className="mt-2 space-y-2">
                            <textarea className="w-full min-h-[80px] px-3 py-2 rounded-lg border text-sm" placeholder="Short text (PDP)" value={short} onChange={(e) => setShort(e.target.value)} />
                            <textarea className="w-full min-h-[120px] px-3 py-2 rounded-lg border text-sm" placeholder="Full text" value={full} onChange={(e) => setFull(e.target.value)} />
                            <div className="flex gap-2">
                                <button type="button" className="min-h-[44px] px-4 rounded-lg bg-blue-600 text-white text-sm font-medium" onClick={() => onUpdate(p.type, { short_text: short, full_text: full }).then(() => setEditing(null))} disabled={!!saving}>
                                    Save
                                </button>
                                <button type="button" className="min-h-[44px] px-4 rounded-lg border text-sm" onClick={() => setEditing(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" className="mt-1 min-h-[44px] px-3 rounded-lg border border-gray-200 text-sm font-medium flex items-center gap-2" onClick={() => { setEditing(p); setShort(p.short_text ?? ''); setFull(p.full_text ?? ''); }}>
                            <Pencil className="h-4 w-4" /> Edit
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

function SectionsList({
    sections,
    onToggle,
    saving,
}: {
    sections: HomepageSection[];
    onToggle: (key: string, is_enabled: boolean) => Promise<void>;
    saving: string | null;
}) {
    return (
        <div className="space-y-2 pt-3">
            {sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="font-medium text-gray-900">{s.section_key.replace(/_/g, ' ')}</span>
                    <label className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{s.is_enabled ? 'On' : 'Off'}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={s.is_enabled}
                            className={`min-w-[44px] min-h-[24px] rounded-full transition-colors touch-manipulation ${s.is_enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            onClick={() => onToggle(s.section_key, !s.is_enabled)}
                            disabled={!!saving}
                        />
                    </label>
                </div>
            ))}
        </div>
    );
}
