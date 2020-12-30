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

export class TimedStorage<I extends IItem> extends LinkedStorage<I> implements IStorage<TimedItem> {
    private expires: number;

    constructor(expires: number, maxItems: number) {
        super(maxItems);
        this.expires = (expires > 0) && +expires || 0;
    }

    get(key: string): I {
        const {expires} = this;
        const item: TimedItem = super.get(key);
        if (!item) return;

        const now = Date.now();
        if (expires && now > item.ttl) {
            this.truncate(item);
            return;
        }

        return item as I;
    }

    set(key: string, value: I): void {
        const item = value as TimedItem;

        const {expires} = this;
        const now = Date.now();

        if (expires) {
            item.ttl = now + expires;
        }

        return super.set(key, value);
    }
}
