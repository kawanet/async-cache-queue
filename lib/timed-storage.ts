/**
 * timed-storage.ts
 */

import {DataStorage, IItem, IStorage} from "./data-storage";

interface LinkedItem extends IItem {
    key?: string;
    prev?: LinkedItem;
}

interface TimedItem extends LinkedItem {
    ttl?: number;
}

/**
 * Storage with TTL for each entries
 */

export class TimedStorage<I extends IItem> extends DataStorage<TimedItem> implements IStorage<TimedItem> {
    private expires: number;
    private maxItems: number;
    private last: LinkedItem = null;
    private size: number = 0;

    constructor(expires: number, maxItems: number) {
        super();
        this.expires = (expires > 0) && +expires || 0;
        this.maxItems = (maxItems > 0) && +maxItems || 0;
    }

    get(key: string): I {
        const {expires} = this;
        const store = this.store();
        const item = store[key];
        if (!item) return;

        const now = Date.now();
        if (expires && item.value && now > item.ttl) {
            this._truncate(item);
        }

        if (item.value) return item as I;
    }

    set(key: string, _item: I): void {
        const item = _item as TimedItem;
        const {expires, maxItems} = this;
        const store = this.store();
        const now = Date.now();

        // remove duplicated item
        const dup = store[key];
        if (dup) {
            if (dup.value) {
                delete store[dup.key];
                this.size--;
                dup.key = dup.value = null;
            }
            this._prune(dup);
        }

        store[key] = item;
        this.size++;
        item.key = key;

        if (expires) {
            item.ttl = now + expires;
        }

        // append at the end of the linked list
        const last = this.last;
        if (last) {
            item.prev = last;
        }
        this.last = item;

        if (maxItems && this.size > maxItems) {
            this._limit();
        }
    }

    protected _prune(item: LinkedItem): void {
        let prev: LinkedItem;

        while (item && !item.value) {
            if (prev) {
                prev.prev = item.prev; // skip item
            } else {
                prev = item; // first item
            }

            item = item.prev; // next item
        }
    }

    /**
     * restrict maximum number of items
     * it costs O(n) as parsing whole of items
     */

    private _limit(): void {
        const {maxItems} = this;
        let item = this.last;
        let prev: LinkedItem;
        let c = 0;

        while (item) {
            if (c >= maxItems) {
                prev.prev = null; // remove rest
                this._truncate(item);
                return;
            }

            if (item.value) {
                c++; // valid item
            } else if (prev) {
                prev.prev = item.prev; // skip item
            } else {
                this.last = item.prev; // first item
            }

            prev = item;
            item = item.prev; // next item
        }
    }

    /**
     * remove rest of items
     */

    private _truncate(item: LinkedItem): void {
        const store = this.store();
        let prev: LinkedItem;

        while (item) {
            if (item.value) {
                delete store[item.key];
                this.size--;
                item.key = item.value = null;
            }

            prev = item;
            item = item.prev; // next item
            prev.prev = null; // terminate link
        }
    }
}
