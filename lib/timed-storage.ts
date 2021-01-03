/**
 * timed-storage.ts
 */

import {Envelope, EnvelopeKVS} from "./data-storage";
import {LinkedStorage} from "./linked-storage";

interface TimedEnvelope<T> extends Envelope<T> {
    ttl?: number;
}

/**
 * Storage with TTL for each entries
 */

export class TimedStorage<E extends Envelope<T>, T = any> implements EnvelopeKVS<E> {
    private expires: number;
    private maxItems: number;
    private limited: number = 0;
    private items = new LinkedStorage<TimedEnvelope<T>>();

    constructor(expires: number, maxItems: number) {
        this.expires = (expires > 0) && +expires || 0;
        this.maxItems = (maxItems > 0) && +maxItems || 0;
    }

    get(key: string): E {
        const {expires, items, maxItems} = this;
        const item = items.get(key);
        if (!item) return;

        if (expires) {
            const now = Date.now();
            // if the cached items is expired, remove rest of items as expired as well.
            if (now > item.ttl) {
                items.truncate(item);
                return;
            }
        }

        if (maxItems && maxItems < items.size) {
            this.limit();
        }

        return item as E;
    }

    set(key: string, value: E): void {
        const item = value as TimedEnvelope<T>;
        const {expires, items, maxItems} = this;

        if (expires) {
            const now = Date.now();
            item.ttl = now + expires;
        }

        items.set(key, value);

        if (maxItems && maxItems < items.size) {
            this.limit();
        }
    }

    private limit() {
        const {items, maxItems} = this;
        const now = Date.now();

        // wait for maxItems milliseconds after the last .limit() method invoked as it costs O(n)
        if (!(now < this.limited + maxItems)) {
            this.limited = now;
            items.limit(maxItems);
        }
    }
}
