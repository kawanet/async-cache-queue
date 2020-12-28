/**
 * timed-storage.ts
 */

import {DataStorage, IItem, IStorage} from "./data-storage";

interface TimedItem extends IItem {
    ttl?: number;
}

/**
 * Storage with TTL for each entries
 */

export class TimedStorage<I extends IItem> extends DataStorage<TimedItem> implements IStorage<TimedItem> {

    private keys = [] as string[];

    constructor(private expires: number) {
        super();
    }

    get(key: string): I {
        const {keys} = this;
        const store = this.store();
        const now = Date.now();

        // garbage collection
        while (keys.length) {
            const first = keys[0];
            const item = store[first];
            if (now < item?.ttl) break;
            keys.shift();
            delete store[first];
        }

        // cached item
        return store[key] as I;
    }

    set(key: string, item: I): void {
        const {keys, expires} = this;
        const store = this.store();
        (item as TimedItem).ttl = Date.now() + expires;
        store[key] = item;
        keys.push(key);
    }
}
