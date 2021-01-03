/**
 * data-storage.ts
 */

export interface Envelope<T> {
    value: T;
}

export interface EnvelopeKVS<E extends Envelope<any>> {
    get(key: string): E;

    set(key: string, value: E): void;
}

/**
 * Persistent Storage
 */

export class SimpleStorage<E extends Envelope<any>> implements EnvelopeKVS<E> {
    private items = {} as { [key: string]: E };

    get(key: string): E {
        return this.items[key];
    }

    set(key: string, value: E): void {
        this.items[key] = value;
    }
}
