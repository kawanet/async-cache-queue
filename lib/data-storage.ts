/**
 * data-storage.ts
 */

export interface Envelope<T> {
    value: T;
}

export interface EnvelopeKVS<T> {
    getItem(key: string): Envelope<T>;

    setItem(key: string, value: Envelope<T>): void;
}

/**
 * Persistent Storage
 */

export class SimpleStorage<T> implements EnvelopeKVS<T> {
    private items = {} as { [key: string]: Envelope<T> };

    getItem(key: string): Envelope<T> {
        return this.items[key];
    }

    setItem(key: string, value: Envelope<T>): void {
        this.items[key] = value;
    }
}
