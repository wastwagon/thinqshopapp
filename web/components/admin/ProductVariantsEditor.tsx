'use client';

import { useEffect, useMemo, useState } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
    type VariantOptionAxis,
    type VariantRow,
    regenerateVariantRows,
    MAX_VARIANT_COMBINATIONS,
} from '@/lib/variant-options';

export type CatalogOption = {
    id: number;
    name: string;
    slug: string;
    values: { id: number; value: string }[];
};

type ProductVariantsEditorProps = {
    basePrice: number;
    catalog: CatalogOption[];
    axes: VariantOptionAxis[];
    variants: VariantRow[];
    onAxesChange: (axes: VariantOptionAxis[]) => void;
    onVariantsChange: (variants: VariantRow[]) => void;
};

function syncRowsFromAxes(
    nextAxes: VariantOptionAxis[],
    previous: VariantRow[],
    onVariantsChange: (v: VariantRow[]) => void,
) {
    const { rows, truncated } = regenerateVariantRows(nextAxes, previous);
    if (truncated) {
        toast.error(`Too many combinations — capped at ${MAX_VARIANT_COMBINATIONS}`);
    }
    onVariantsChange(rows);
}

export default function ProductVariantsEditor({
    basePrice,
    catalog,
    axes,
    variants,
    onAxesChange,
    onVariantsChange,
}: ProductVariantsEditorProps) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [editingAxisIdx, setEditingAxisIdx] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editValues, setEditValues] = useState<string[]>([]);
    const [newValue, setNewValue] = useState('');
    const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
    const [dragFrom, setDragFrom] = useState<number | null>(null);

    const unusedCatalog = useMemo(
        () => catalog.filter((c) => !axes.some((a) => a.slug === c.slug)),
        [catalog, axes],
    );

    useEffect(() => {
        setSelected((prev) => {
            const next = new Set<number>();
            prev.forEach((i) => {
                if (i < variants.length) next.add(i);
            });
            return next;
        });
    }, [variants.length]);

    const openEditAxis = (idx: number) => {
        const a = axes[idx];
        setEditingAxisIdx(idx);
        setEditName(a.name);
        setEditSlug(a.slug);
        setEditValues([...a.values]);
        setNewValue('');
    };

    const saveEditAxis = () => {
        if (editingAxisIdx == null) return;
        const values = editValues.map((v) => v.trim()).filter(Boolean);
        if (!editName.trim() || !editSlug.trim()) {
            toast.error('Option name is required');
            return;
        }
        if (values.length === 0) {
            toast.error('Add at least one value');
            return;
        }
        const next = axes.map((a, i) =>
            i === editingAxisIdx
                ? { slug: editSlug.trim(), name: editName.trim(), values }
                : a,
        );
        onAxesChange(next);
        syncRowsFromAxes(next, variants, onVariantsChange);
        setEditingAxisIdx(null);
    };

    const addAnotherOption = () => {
        const nextOpt = unusedCatalog[0];
        if (!nextOpt) {
            toast.error('No more catalog options. Add one under Variations first.');
            return;
        }
        const next: VariantOptionAxis[] = [
            ...axes,
            {
                slug: nextOpt.slug,
                name: nextOpt.name,
                values: nextOpt.values.map((v) => v.value).slice(0, 5),
            },
        ];
        onAxesChange(next);
        syncRowsFromAxes(next, variants, onVariantsChange);
    };

    const removeAxis = (idx: number) => {
        const next = axes.filter((_, i) => i !== idx);
        onAxesChange(next);
        syncRowsFromAxes(next, variants, onVariantsChange);
    };

    const moveAxis = (from: number, to: number) => {
        if (to < 0 || to >= axes.length || from === to) return;
        const next = [...axes];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onAxesChange(next);
        syncRowsFromAxes(next, variants, onVariantsChange);
    };

    const updateRow = (idx: number, patch: Partial<VariantRow>) => {
        onVariantsChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
    };

    const unitPrice = (row: VariantRow) =>
        Number((basePrice + Number(row.price_adjust ?? 0)).toFixed(2));

    const setUnitPrice = (idx: number, unit: number) => {
        const adjust = Number((unit - basePrice).toFixed(2));
        updateRow(idx, { price_adjust: adjust });
    };

    const toggleSelect = (idx: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const selectAll = () => setSelected(new Set(variants.map((_, i) => i)));
    const selectNone = () => setSelected(new Set());

    const selectByOptionValue = (slug: string, value: string) => {
        const next = new Set<number>();
        variants.forEach((v, i) => {
            if (v.option_values?.[slug] === value) next.add(i);
        });
        setSelected(next);
    };

    const catalogValuesForSlug = (slug: string) =>
        catalog.find((c) => c.slug === slug)?.values.map((v) => v.value) ?? [];

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {axes.length === 0 && (
                    <p className="text-xs text-gray-500 px-3 py-3">
                        Add options (e.g. Color, Size) to generate variant combinations.{' '}
                        {catalog.length === 0 && (
                            <>
                                <Link href="/admin/variations" className="text-brand underline font-medium">
                                    Set up options in Variations
                                </Link>
                                .
                            </>
                        )}
                    </p>
                )}
                {axes.map((axis, idx) => (
                    <div
                        key={`${axis.slug}-${idx}`}
                        draggable
                        onDragStart={() => setDragFrom(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                            if (dragFrom != null) moveAxis(dragFrom, idx);
                            setDragFrom(null);
                        }}
                        className="flex items-start gap-2 px-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                        <button
                            type="button"
                            className="mt-1 p-1 text-gray-400 cursor-grab active:cursor-grabbing"
                            aria-label={`Reorder ${axis.name}`}
                            title="Drag to reorder"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{axis.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {axis.values.map((val) => (
                                    <span
                                        key={val}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                                    >
                                        {val}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            onClick={() => openEditAxis(idx)}
                        >
                            Edit
                        </Button>
                    </div>
                ))}
                <div className="px-3 py-2.5 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={addAnotherOption}
                        disabled={unusedCatalog.length === 0 && axes.length > 0}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {axes.length === 0 ? 'Add option' : 'Add another option'}
                    </button>
                </div>
            </div>

            {variants.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Variants</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand mb-2">
                        <span className="text-gray-500">Select:</span>
                        <button type="button" className="font-semibold hover:underline" onClick={selectAll}>
                            All
                        </button>
                        <button type="button" className="font-semibold hover:underline" onClick={selectNone}>
                            None
                        </button>
                        {axes.map((axis) => (
                            <label key={axis.slug} className="inline-flex items-center gap-1 font-semibold">
                                <span>{axis.name}</span>
                                <select
                                    className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-700 font-normal"
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (e.target.value) selectByOptionValue(axis.slug, e.target.value);
                                        e.target.value = '';
                                    }}
                                    aria-label={`Select by ${axis.name}`}
                                >
                                    <option value="">…</option>
                                    {axis.values.map((v) => (
                                        <option key={v} value={v}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>

                    <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                        <table className="w-full text-sm min-w-[520px]">
                            <thead>
                                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
                                    <th className="w-10 px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={variants.length > 0 && selected.size === variants.length}
                                            onChange={(e) => (e.target.checked ? selectAll() : selectNone())}
                                            aria-label="Select all variants"
                                        />
                                    </th>
                                    <th className="px-2 py-2">Variant</th>
                                    <th className="px-2 py-2 w-28">Price</th>
                                    <th className="px-2 py-2 w-24">Quantity</th>
                                    <th className="px-2 py-2 w-28">SKU</th>
                                    <th className="px-2 py-2 w-16" />
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((row, idx) => (
                                    <tr key={row.variant_value + idx} className="border-b border-gray-100 last:border-0">
                                        <td className="px-3 py-2 align-middle">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(idx)}
                                                onChange={() => toggleSelect(idx)}
                                                aria-label={`Select ${row.variant_value}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 font-semibold text-gray-900 align-middle">
                                            {row.variant_value}
                                        </td>
                                        <td className="px-2 py-2 align-middle">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                                    ₵
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={unitPrice(row)}
                                                    onChange={(e) =>
                                                        setUnitPrice(idx, e.target.value ? parseFloat(e.target.value) : 0)
                                                    }
                                                    className="h-8 w-full pl-5 pr-2 rounded-md border border-gray-200 text-sm"
                                                    aria-label={`Price for ${row.variant_value}`}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 align-middle">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.stock_quantity ?? 0}
                                                onChange={(e) =>
                                                    updateRow(idx, {
                                                        stock_quantity: e.target.value
                                                            ? parseInt(e.target.value, 10)
                                                            : 0,
                                                    })
                                                }
                                                className="h-8 w-full px-2 rounded-md border border-gray-200 text-sm"
                                                aria-label={`Quantity for ${row.variant_value}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 align-middle">
                                            <input
                                                type="text"
                                                value={row.sku ?? ''}
                                                onChange={(e) =>
                                                    updateRow(idx, { sku: e.target.value || undefined })
                                                }
                                                className="h-8 w-full px-2 rounded-md border border-gray-200 text-sm"
                                                placeholder="SKU"
                                                aria-label={`SKU for ${row.variant_value}`}
                                            />
                                        </td>
                                        <td className="px-2 py-2 align-middle">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setEditingRowIdx(idx)}
                                            >
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                open={editingAxisIdx != null}
                onClose={() => setEditingAxisIdx(null)}
                title="Edit option"
                size="md"
                footer={
                    <div className="flex justify-between gap-2 w-full">
                        {editingAxisIdx != null && axes.length > 1 ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    removeAxis(editingAxisIdx);
                                    setEditingAxisIdx(null);
                                }}
                            >
                                Remove option
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditingAxisIdx(null)}>
                                Cancel
                            </Button>
                            <Button type="button" variant="primary" onClick={saveEditAxis}>
                                Done
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Option name</label>
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Color"
                        />
                    </div>
                    {editSlug && (
                        <p className="text-[11px] text-gray-400">Slug: {editSlug}</p>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Values</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {editValues.map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setEditValues((vs) => vs.filter((x) => x !== val))}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                                    title="Remove value"
                                >
                                    {val} ×
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder="Add value"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const v = newValue.trim();
                                        if (v && !editValues.includes(v)) {
                                            setEditValues((vs) => [...vs, v]);
                                            setNewValue('');
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    const v = newValue.trim();
                                    if (v && !editValues.includes(v)) {
                                        setEditValues((vs) => [...vs, v]);
                                        setNewValue('');
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                        {editSlug && catalogValuesForSlug(editSlug).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {catalogValuesForSlug(editSlug)
                                    .filter((v) => !editValues.includes(v))
                                    .map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            className="text-[11px] px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-gray-500 hover:border-brand hover:text-brand"
                                            onClick={() => setEditValues((vs) => [...vs, v])}
                                        >
                                            + {v}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal
                open={editingRowIdx != null}
                onClose={() => setEditingRowIdx(null)}
                title={editingRowIdx != null ? `Edit ${variants[editingRowIdx]?.variant_value}` : 'Edit variant'}
                size="sm"
                footer={
                    <Button type="button" variant="primary" onClick={() => setEditingRowIdx(null)}>
                        Done
                    </Button>
                }
            >
                {editingRowIdx != null && variants[editingRowIdx] && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Price (GHS)</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={unitPrice(variants[editingRowIdx])}
                                onChange={(e) =>
                                    setUnitPrice(
                                        editingRowIdx,
                                        e.target.value ? parseFloat(e.target.value) : 0,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                            <Input
                                type="number"
                                min="0"
                                value={variants[editingRowIdx].stock_quantity ?? 0}
                                onChange={(e) =>
                                    updateRow(editingRowIdx, {
                                        stock_quantity: e.target.value ? parseInt(e.target.value, 10) : 0,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">SKU</label>
                            <Input
                                value={variants[editingRowIdx].sku ?? ''}
                                onChange={(e) =>
                                    updateRow(editingRowIdx, { sku: e.target.value || undefined })
                                }
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
