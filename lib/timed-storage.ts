/**
 * timed-storage.ts
 */

import {IItem, IStorage} from "./data-storage";
import {LinkedStorage} from "./linked-storage";

interface TimedItem extends IItem {
    ttl?: number;
}

/**
 * Storage with TTL for each entries
 */

export class TimedStorage<I extends IItem> implements IStorage<TimedItem> {
    private expires: number;
    private maxItems: number;
    private items = new LinkedStorage<I>();

    constructor(expires: number, maxItems: number) {
        this.expires = (expires > 0) && +expires || 0;
        this.maxItems = (maxItems > 0) && +maxItems || 0;
    }

    get(key: string): I {
        const {expires, items} = this;
        const item: TimedItem = items.get(key);
        if (!item) return;

        if (expires) {
            const now = Date.now();
            // if the cached items is expired, remove rest of items as expired as well.
            if (now > item.ttl) {
                items.truncate(item);
                return;
            }
        }

        return item as I;
    }

    set(key: string, value: I): void {
        const item = value as TimedItem;
        const {expires, items, maxItems} = this;

        if (expires) {
            const now = Date.now();
            item.ttl = now + expires;
        }

        items.set(key, value);

        if (maxItems) {
            items.limit(maxItems);
        }
    }
}
