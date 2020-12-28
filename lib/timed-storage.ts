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
            if (now <= item?.ttl) break;
            keys.shift();
            delete store[first];
        }

        // cached item
        const item = store[key];

        // check the item expired
        // this would rarely happen though
        if (now > item?.ttl) {
            removeKey(keys, key);
            delete store[key];
            return;
        }

        return item as I;
    }

    set(key: string, item: I): void {
        const {keys, expires} = this;
        const store = this.store();

        // check the key already exists
        // this would happen on refreshing
        if (store[key]) {
            removeKey(keys, key);
        }

        (item as TimedItem).ttl = Date.now() + expires;
        store[key] = item;
        keys.push(key);
    }
}

/**
 * sadly O(n)
 */

function removeKey(keys: string[], key: string) {
    const length = keys.length;
    for (let i = 0; i < length; i++) {
        if (keys[i] === key) {
            keys.splice(i, 1);
            break;
        }
    }
}