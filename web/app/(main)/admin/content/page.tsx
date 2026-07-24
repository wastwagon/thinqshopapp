'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
    Layout,
    ChevronDown,
    ChevronUp,
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { cn } from '@/lib/cn';

type HeroSlide = { id: number; title: string; subtitle?: string | null; cta_text?: string | null; cta_url?: string | null; image_path?: string | null; sort_order: number; is_active: boolean };
type TrustBadge = { id: number; icon: string; label: string; optional_link?: string | null; sort_order: number; is_active: boolean };
type Testimonial = { id: number; quote: string; author_name: string; author_role?: string | null; avatar_path?: string | null; sort_order: number; is_active: boolean };
type Policy = { id: number; type: string; short_text?: string | null; full_text?: string | null };
type HomepageSection = { id: number; section_key: string; sort_order: number; is_enabled: boolean };

const formatCmsLabel = (value?: string | null): string =>
    (value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

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
                    <LoadingSpinner label="Loading content…" />
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
            <div className="pb-6 md:pb-8">
            <AdminPageHeader
                icon={Layout}
                title="Content"
                subtitle="Manage homepage sections, testimonials, and policy text"
            />
            <div className="space-y-3">
                {sectionCards.map(({ id, title, count }) => (
                    <div key={id} className="admin-card overflow-hidden">
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
    const { confirm, confirmDialog } = useConfirmDialog();
    const [editing, setEditing] = useState<HeroSlide | null>(null);
    const [form, setForm] = useState({ title: '', subtitle: '', cta_text: '', cta_url: '', image_path: '', is_active: true });
    const [uploadingImage, setUploadingImage] = useState(false);
    const heroImageInputRef = React.useRef<HTMLInputElement>(null);

    const saveSlide = async () => {
        const isNew = !editing || editing.id === 0;
        setSaving('hero');
        try {
            if (!isNew && editing) {
                await api.patch(`/content/admin/hero-slides/${editing.id}`, {
                    ...form,
                    image_path: form.image_path || undefined,
                });
                toast.success('Slide updated');
            } else {
                await api.post('/content/admin/hero-slides', {
                    ...form,
                    image_path: form.image_path || undefined,
                });
                toast.success('Slide added');
                setForm({ title: '', subtitle: '', cta_text: '', cta_url: '', image_path: '', is_active: true });
            }
            setEditing(null);
            onReload();
        } catch {
            toast.error(isNew ? 'Failed to add' : 'Failed to update');
        } finally {
            setSaving(null);
        }
    };

    const deleteSlide = async (id: number) => {
        const ok = await confirm({ title: 'Delete this slide?', confirmLabel: 'Delete' });
        if (!ok) return;
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

    const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image (JPEG, PNG, GIF, WebP)');
            return;
        }
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/media/upload', formData, { headers: { 'Content-Type': undefined } });
            if (data?.url || data?.path) {
                const path = data.url || data.path;
                setForm((f) => ({ ...f, image_path: path }));
                toast.success('Image uploaded');
            } else {
                toast.error(data?.error || 'Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const heroImageBlock = (
        <FormField label="Hero background image">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        ref={heroImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleHeroImageUpload}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => heroImageInputRef.current?.click()}
                        disabled={uploadingImage}
                        loading={uploadingImage}
                        leftIcon={!uploadingImage ? <Upload className="h-4 w-4" /> : undefined}
                    >
                        {uploadingImage ? 'Uploading…' : 'Upload image'}
                    </Button>
                    {form.image_path && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setForm((f) => ({ ...f, image_path: '' }))}
                            className="text-red-600 border-red-200/90 hover:bg-red-50"
                        >
                            Remove
                        </Button>
                    )}
                </div>
                {form.image_path && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                            <img
                                src={form.image_path.startsWith('http') ? form.image_path : getMediaUrl(form.image_path)}
                                alt="Hero"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-xs text-gray-500 truncate flex-1 min-w-0" title={form.image_path}>
                            {form.image_path}
                        </p>
                    </div>
                )}
                <Input
                    type="text"
                    placeholder="Or paste image URL (optional)"
                    value={form.image_path?.startsWith('http') ? form.image_path : ''}
                    onChange={(e) => setForm((f) => ({ ...f, image_path: e.target.value }))}
                />
            </div>
        </FormField>
    );

    const slideFields = (
        <div className="space-y-2">
            <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
                placeholder="Subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
            {heroImageBlock}
            <Input
                placeholder="CTA text"
                value={form.cta_text}
                onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
            />
            <Input
                placeholder="CTA URL"
                value={form.cta_url}
                onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))}
            />
        </div>
    );

    return (
        <div className="space-y-3 pt-3">
            {editing && editing.id === 0 && (
                <div className="flat-card border-l-4 border-l-brand p-3 space-y-3">
                    {slideFields}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={saveSlide}
                            disabled={!!saving}
                            loading={saving === 'hero'}
                            leftIcon={saving !== 'hero' ? <Save className="h-4 w-4" /> : undefined}
                        >
                            Save
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            leftIcon={<X className="h-4 w-4" />}
                            onClick={() => setEditing(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
            {slides.map((s) => (
                <div key={s.id} className="flat-card p-3">
                    {editing?.id === s.id ? (
                        <div className="space-y-3">
                            {slideFields}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={saveSlide}
                                    disabled={!!saving}
                                    loading={saving === 'hero'}
                                    leftIcon={saving !== 'hero' ? <Save className="h-4 w-4" /> : undefined}
                                >
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setEditing(null)}
                                    aria-label="Cancel"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-medium text-gray-900">{s.title}</p>
                                {s.subtitle && <p className="text-xs text-gray-500 mt-0.5">{s.subtitle}</p>}
                                {s.image_path && (
                                    <p
                                        className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]"
                                        title={s.image_path}
                                    >
                                        Image set
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="min-w-[44px] px-0"
                                    aria-label="Edit slide"
                                    onClick={() => {
                                        setEditing(s);
                                        setForm({
                                            title: s.title,
                                            subtitle: s.subtitle ?? '',
                                            cta_text: s.cta_text ?? '',
                                            cta_url: s.cta_url ?? '',
                                            image_path: s.image_path ?? '',
                                            is_active: s.is_active,
                                        });
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="min-w-[44px] px-0 text-red-600 border-red-200/90 hover:bg-red-50"
                                    aria-label="Delete slide"
                                    onClick={() => void deleteSlide(s.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {!editing && (
                <button
                    type="button"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200/90 text-gray-600 font-medium text-sm touch-manipulation hover:border-brand/40 hover:text-brand transition-colors"
                    onClick={() => {
                        setEditing({
                            id: 0,
                            title: '',
                            subtitle: '',
                            cta_text: '',
                            cta_url: '',
                            image_path: '',
                            sort_order: 0,
                            is_active: true,
                        } as HeroSlide);
                        setForm({
                            title: '',
                            subtitle: '',
                            cta_text: '',
                            cta_url: '',
                            image_path: '',
                            is_active: true,
                        });
                    }}
                >
                    <Plus className="h-5 w-5" /> Add slide
                </button>
            )}
            {confirmDialog}
        </div>
    );
}

function TrustSection({
    badges,
}: {
    badges: TrustBadge[];
    onReload: () => void;
    setSaving: (v: string | null) => void;
    saving: string | null;
}) {
    return (
        <div className="space-y-2 pt-3">
            {badges.map((b) => (
                <div key={b.id} className="flat-card p-3 flex items-center justify-between">
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
}: {
    items: Testimonial[];
    onReload: () => void;
    setSaving: (v: string | null) => void;
    saving: string | null;
}) {
    return (
        <div className="space-y-2 pt-3">
            {items.map((t) => (
                <div key={t.id} className="flat-card p-3">
                    <p className="text-sm text-gray-700 line-clamp-2">&ldquo;{t.quote}&rdquo;</p>
                    <p className="text-xs font-medium text-gray-900 mt-1">
                        — {t.author_name}
                        {t.author_role ? `, ${t.author_role}` : ''}
                    </p>
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
                <div key={p.id} className="flat-card p-3">
                    <p className="font-medium text-gray-900">{formatCmsLabel(p.type)}</p>
                    {editing?.id === p.id ? (
                        <div className="mt-2 space-y-2">
                            <Textarea
                                placeholder="Short customer-facing summary"
                                value={short}
                                onChange={(e) => setShort(e.target.value)}
                            />
                            <Textarea
                                placeholder="Full policy text for policy pages"
                                value={full}
                                onChange={(e) => setFull(e.target.value)}
                                className="min-h-[120px]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    loading={!!saving}
                                    disabled={!!saving}
                                    onClick={() =>
                                        onUpdate(p.type, { short_text: short, full_text: full }).then(() =>
                                            setEditing(null)
                                        )
                                    }
                                >
                                    Save
                                </Button>
                                <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="mt-1"
                            leftIcon={<Pencil className="h-4 w-4" />}
                            onClick={() => {
                                setEditing(p);
                                setShort(p.short_text ?? '');
                                setFull(p.full_text ?? '');
                            }}
                        >
                            Edit
                        </Button>
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
                <div key={s.id} className="flat-card p-3 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{formatCmsLabel(s.section_key)}</span>
                    <label className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{s.is_enabled ? 'On' : 'Off'}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={s.is_enabled}
                            className={cn(
                                'min-w-[44px] min-h-[24px] rounded-full transition-colors touch-manipulation',
                                s.is_enabled ? 'bg-brand' : 'bg-gray-200'
                            )}
                            onClick={() => onToggle(s.section_key, !s.is_enabled)}
                            disabled={!!saving}
                        />
                    </label>
                </div>
            ))}
        </div>
    );
}
