/**
 * linked-storage.ts
 */

import {Envelope, EnvelopeKVS} from "./data-storage";

interface LinkedEnvelope<T> extends Envelope<T> {
    key?: string;
    next?: LinkedEnvelope<T>;
    deleted?: boolean;
}

export class LinkedStorage<E extends Envelope<T>, T = any> implements EnvelopeKVS<E> {
    private latest: LinkedEnvelope<T> = null;
    private items = {} as { [key: string]: LinkedEnvelope<T> };
    private length: number = 0;

    get(key: string): E {
        const item = this.items[key];
        if (item && !item.deleted) return item as E;
    }

    set(key: string, value: E): void {
        const item = value as LinkedEnvelope<T>;

        // remove duplicated item
        this.delete(key);

        this.items[key] = item;
        this.length++;
        item.key = key;

        // append at the end of the linked list
        const latest = this.latest;
        if (latest) {
            item.next = latest.deleted ? latest.next : latest;
        }
        this.latest = item;
    }

    size(): number {
        return this.length;
    }

    /**
     * restrict maximum number of items
     * it costs O(n) as parsing whole of items
     */

    shrink(size: number): void {
        let item = this.latest;

        while (item) {
            if (0 >= size) {
                this.truncate(item as E);
                return;
            }

            if (!item.deleted) {
                size--;
            }

            item = item.next; // next item
        }
    }

    /**
     * remove given item
     */

    delete(key: string): void {
        let item = this.get(key);
        if (item) this._delete(item);
    }

    private _delete(item: LinkedEnvelope<T>): void {
        if (!item) return;
        let prev: LinkedEnvelope<T>;

        if (!item.deleted) {
            delete this.items[item.key];
            this.length--;
            item.key = item.value = null;
            item.deleted = true;
        }

        while (item && item.deleted) {
            if (prev) prev.next = item.next; // shortcut link
            prev = item;
            item = item.next; // next item
        }
    }

    /**
     * remove given item and rest of items
     */

    truncate(value: E): void {
        let item = value as LinkedEnvelope<T>;

        while (item) {
            this._delete(item);
            item = item.next; // next item
        }
    }

    /**
     * return an array containing all the elements in proper sequence
     */

    values(): E[] {
        const array: E[] = [];

        let item = this.latest;
        while (item) {
            if (!item.deleted) array.push(item as E);
            item = item.next;
        }

        // this.size = array.length;

        return array.reverse();
    }
}
