/**
 * data-storage.ts
 */

import {TimedKVS} from "timed-kvs";
import {objectFactory} from "./container";

export interface Envelope<T> {
    value: T;
}

/**
 * EnvelopeKVS is the interface for synchronous key-value storages
 * which store enveloped values, instead of naked values.
 * Both of TimedKVS and SimpleStorage implement the interface.
 */

interface EnvelopeKVS<T> {
    getItem(key: string): Envelope<T>;

    setItem(key: string, value: Envelope<T>): void;
}

/**
 * Persistent Storage
 */

class SimpleStorage<T> implements EnvelopeKVS<T> {
    private items = {} as { [key: string]: Envelope<T> };

    getItem(key: string): Envelope<T> {
        return this.items[key];
    }

    setItem(key: string, value: Envelope<T>): void {
        this.items[key] = value;
    }
}

/**
 * returns a function which returns an EnvelopeKVS instance.
 */

export function getStorage<T>(expires: number, maxItems: number): () => EnvelopeKVS<T> {
    if (expires > 0 || maxItems > 0) return objectFactory(() => new TimedKVS<T>({expires, maxItems}));
    if (expires < 0) return objectFactory(() => new SimpleStorage<T>());
}