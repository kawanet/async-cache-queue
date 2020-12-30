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
    private limited: number = 0;
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
        const now = Date.now();

        if (expires) {
            item.ttl = now + expires;
        }

        items.set(key, value);

        if (maxItems && maxItems < items.size) {
            // wait for maxItems milliseconds after the last .limit() method invoked as it costs O(n)
            if (!(now < this.limited + maxItems)) {
                this.limited = now;
                items.limit(maxItems);
            }
        }
    }
}
