/**
 * Analytics abstraction for customer behavior and site performance.
 * Wire your provider (GA4, PostHog, Mixpanel, etc.) via env and implement track*.
 * No PII in event names or payloads.
 */

export type AnalyticsEvent =
    | { name: 'page_view'; path: string; title?: string }
    | { name: 'view_item'; product_id?: string; product_name?: string; category?: string }
    | { name: 'add_to_cart'; product_id?: string; quantity?: number; value?: number }
    | { name: 'remove_from_cart'; product_id?: string }
    | { name: 'begin_checkout'; value?: number; items?: number }
    | { name: 'purchase'; order_id?: string; value?: number; currency?: string }
    | { name: 'search'; term: string }
    | { name: 'view_item_list'; list_id?: string; category?: string };

const noop = () => {};

function getTracker() {
    if (typeof window === 'undefined') return noop;
    const key = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
    if (key !== 'true' && key !== '1') return noop;
    return (event: AnalyticsEvent) => {
        try {
            (window as any).__analytics?.track?.(event);
            if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
                (window as any).gtag?.('event', event.name, eventPayloadForGA(event));
            }
        } catch {
            // avoid breaking the app
        }
    };
}

function eventPayloadForGA(e: AnalyticsEvent): Record<string, unknown> {
    switch (e.name) {
        case 'page_view':
            return { page_path: e.path, page_title: e.title };
        case 'view_item':
            return {
                items: e.product_id ? [{ item_id: e.product_id, item_name: e.product_name, item_category: e.category }] : undefined,
            };
        case 'add_to_cart':
            return {
                currency: 'GHS',
                value: e.value,
                items: e.product_id ? [{ item_id: e.product_id, quantity: e.quantity }] : undefined,
            };
        case 'begin_checkout':
            return { currency: 'GHS', value: e.value };
        case 'purchase':
            return { transaction_id: e.order_id, value: e.value, currency: e.currency ?? 'GHS' };
        case 'search':
            return { search_term: e.term };
        default:
            return {};
    }
}

let trackFn: (event: AnalyticsEvent) => void = noop;

export function initAnalytics() {
    trackFn = getTracker();
}

export function trackPageView(path: string, title?: string) {
    trackFn({ name: 'page_view', path, title });
}

export function trackViewItem(productId?: string, productName?: string, category?: string) {
    trackFn({ name: 'view_item', product_id: productId, product_name: productName, category });
}

export function trackAddToCart(productId?: string, quantity?: number, value?: number) {
    trackFn({ name: 'add_to_cart', product_id: productId, quantity, value });
}

export function trackRemoveFromCart(productId?: string) {
    trackFn({ name: 'remove_from_cart', product_id: productId });
}

export function trackBeginCheckout(value?: number, items?: number) {
    trackFn({ name: 'begin_checkout', value, items });
}

export function trackPurchase(orderId?: string, value?: number, currency?: string) {
    trackFn({ name: 'purchase', order_id: orderId, value, currency });
}

export function trackSearch(term: string) {
    trackFn({ name: 'search', term });
}

export function trackViewItemList(listId?: string, category?: string) {
    trackFn({ name: 'view_item_list', list_id: listId, category });
}
