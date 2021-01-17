/**
 * linked-storage.ts
 */

import {Envelope, EnvelopeKVS} from "./data-storage";

interface Item<T> extends Envelope<T> {
    key?: string;
    next?: Item<T>;
    deleted?: boolean;
}

export class LinkedStorage<T> extends EnvelopeKVS<T> {
    private latest: Item<T> = null;
    private items = {} as { [key: string]: Item<T> };
    private length: number = 0;

    getItem(key: string): Envelope<T> {
        const item = this.items[key];
        if (item && !item.deleted) return item as Envelope<T>;
    }

    setItem(key: string, value: Envelope<T>): void {
        const item = value as Item<T>;

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
                this.truncate(item as Envelope<T>);
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
        let item = this.getItem(key);
        if (item) this._delete(item);
    }

    private _delete(item: Item<T>): void {
        if (!item) return;
        let prev: Item<T>;

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

    truncate(value: Envelope<T>): void {
        let item = value as Item<T>;

        while (item) {
            this._delete(item);
            item = item.next; // next item
        }
    }

    /**
     * return an array containing all the elements in proper sequence
     */

    values(): Envelope<T>[] {
        const array: Envelope<T>[] = [];

        let item = this.latest;
        while (item) {
            if (!item.deleted) array.push(item as Envelope<T>);
            item = item.next;
        }

        // this.size = array.length;

        return array.reverse();
    }
}
