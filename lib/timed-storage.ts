/**
 * timed-storage.ts
 */

import {Envelope, EnvelopeKVS} from "./data-storage";
import {LinkedStorage} from "./linked-storage";

interface Item<T> extends Envelope<T> {
    ttl?: number;
}

/**
 * Storage with TTL for each entries
 */

export class TimedStorage<T> implements EnvelopeKVS<T> {
    private expires: number;
    private maxItems: number;
    private limited: number = 0;
    private items = new LinkedStorage<T>();

    constructor(expires: number, maxItems: number) {
        this.expires = (expires > 0) && +expires || 0;
        this.maxItems = (maxItems > 0) && +maxItems || 0;
    }

    getItem(key: string): Envelope<T> {
        const {expires, items, maxItems} = this;
        const item = items.getItem(key) as Item<T>;
        if (!item) return;

        if (expires) {
            const now = Date.now();
            // if the cached items is expired, remove rest of items as expired as well.
            if (now > item.ttl) {
                items.truncate(item);
                return;
            }
        }

        if (maxItems && maxItems < items.size()) {
            this._checkSize();
        }

        return item as Envelope<T>;
    }

    setItem(key: string, value: Envelope<T>): void {
        const item = value as Item<T>;
        const {expires, items, maxItems} = this;

        if (expires) {
            const now = Date.now();
            item.ttl = now + expires;
        }

        items.setItem(key, value);

        if (maxItems && maxItems < items.size()) {
            this._checkSize();
        }
    }

    private _checkSize() {
        const {items, maxItems} = this;
        const now = Date.now();

        // wait for maxItems milliseconds after the last .limit() method invoked as it costs O(n)
        if (!(now < this.limited + maxItems)) {
            this.limited = now;
            items.shrink(maxItems);
        }
    }
}
