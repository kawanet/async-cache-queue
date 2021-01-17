/**
 * data-storage.ts
 */
import {ACQ} from "../types/async-cache-queue";

export interface Envelope<T> {
    value: T;
}

export abstract class EnvelopeKVS<T> implements ACQ.MapLike<T> {
    get(key: string): T {
        const item = this.getItem(key);
        if (item) return item.value;
    }

    set(key: string, value: T): void {
        this.setItem(key, {value: value});
    }

    abstract getItem(key: string): Envelope<T>;

    abstract setItem(key: string, value: Envelope<T>): void;
}

/**
 * Persistent Storage
 */

export class SimpleStorage<T> extends EnvelopeKVS<T> {
    private items = {} as { [key: string]: Envelope<T> };

    getItem(key: string): Envelope<T> {
        return this.items[key];
    }

    setItem(key: string, value: Envelope<T>): void {
        this.items[key] = value;
    }
}
