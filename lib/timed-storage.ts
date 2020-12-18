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

export class TimedStorage extends DataStorage implements IStorage {

    private keys = [] as string[];

    constructor(private expires: number) {
        super();
    }

    get(key: string): IItem {
        const {keys} = this;
        const store = this.store();
        const now = Date.now();

        // garbage collection
        while (keys.length) {
            const first = keys[0];
            const item: TimedItem = store[first];
            if (now < item?.ttl) break;
            keys.shift();
            delete store[first];
        }

        // cached item
        return store[key];
    }

    set(key: string, item: TimedItem): void {
        const {keys, expires} = this;
        const store = this.store();
        item.ttl = Date.now() + expires;
        store[key] = item;
        keys.push(key);
    }
}
