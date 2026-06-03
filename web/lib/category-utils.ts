export type CategoryNode = {
    id: number;
    name: string;
    slug: string;
    parent_id?: number | null;
    sort_order?: number;
    is_active?: boolean;
    parent?: { id: number; name: string; slug: string } | null;
    children?: CategoryNode[];
};

export function getRootCategories(categories: CategoryNode[]): CategoryNode[] {
    return categories.filter((c) => c.parent_id == null);
}

/** Subcategories only — for product assignment */
export function getLeafCategories(categories: CategoryNode[]): CategoryNode[] {
    return categories.filter((c) => c.parent_id != null);
}

export function findCategoryBySlug(categories: CategoryNode[], slug: string): CategoryNode | undefined {
    const norm = slug.toLowerCase();
    for (const c of categories) {
        if ((c.slug ?? '').toLowerCase() === norm) return c;
        for (const ch of c.children ?? []) {
            if ((ch.slug ?? '').toLowerCase() === norm) return ch;
        }
    }
    return categories.find((c) => (c.slug ?? '').toLowerCase() === norm);
}

export function getParentSlug(categorySlug: string, categories: CategoryNode[]): string | null {
    const cat = findCategoryBySlug(categories, categorySlug);
    if (!cat) return null;
    if (cat.parent_id != null) {
        const parent = categories.find((c) => c.id === cat.parent_id);
        return parent?.slug ?? cat.parent?.slug ?? null;
    }
    const roots = getRootCategories(categories);
    const root = roots.find((r) => r.slug === categorySlug);
    if (root) return root.slug;
    return null;
}

/** Flat list for search: roots then indented children */
export function flattenCategoryTree(categories: CategoryNode[]): { cat: CategoryNode; depth: number }[] {
    const roots = getRootCategories(categories).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
    );
    const out: { cat: CategoryNode; depth: number }[] = [];
    for (const root of roots) {
        out.push({ cat: root, depth: 0 });
        const children = (root.children ?? categories.filter((c) => c.parent_id === root.id))
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
        for (const ch of children) {
            out.push({ cat: ch, depth: 1 });
        }
    }
    const orphanLeaves = categories.filter(
        (c) => c.parent_id != null && !roots.some((r) => r.id === c.parent_id),
    );
    for (const o of orphanLeaves) {
        out.push({ cat: o, depth: 1 });
    }
    return out;
}

export function groupLeavesByParent(categories: CategoryNode[]): { parent: CategoryNode; leaves: CategoryNode[] }[] {
    const roots = getRootCategories(categories);
    const leaves = getLeafCategories(categories);
    const groups: { parent: CategoryNode; leaves: CategoryNode[] }[] = [];
    for (const root of roots) {
        const groupLeaves = leaves.filter((l) => l.parent_id === root.id);
        if (groupLeaves.length > 0) {
            groups.push({ parent: root, leaves: groupLeaves });
        }
    }
    const ungrouped = leaves.filter((l) => !l.parent_id);
    if (ungrouped.length > 0) {
        groups.push({
            parent: { id: 0, name: 'Other', slug: 'other' },
            leaves: ungrouped,
        });
    }
    return groups;
}
