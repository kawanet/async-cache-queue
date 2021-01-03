import {Envelope, EnvelopeKVS} from "./data-storage";

interface LinkedEnvelope<T> extends Envelope<T> {
    key?: string;
    next?: LinkedEnvelope<T>;
}

export class LinkedStorage<E extends Envelope<T>, T = any> implements EnvelopeKVS<E> {
    private last: LinkedEnvelope<T> = null;
    private items = {} as { [key: string]: LinkedEnvelope<T> };
    size: number = 0;

    get(key: string): E {
        const item = this.items[key];
        if (item && item.value) return item as E;
    }

    set(key: string, value: E): void {
        const item = value as LinkedEnvelope<T>;

        // remove duplicated item
        this.delete(key);

        this.items[key] = item;
        this.size++;
        item.key = key;

        // append at the end of the linked list
        const last = this.last;
        if (last) {
            item.next = last.value ? last : last.next;
        }
        this.last = item;
    }

    /**
     * restrict maximum number of items
     * it costs O(n) as parsing whole of items
     */

    limit(limit: number): void {
        let item = this.last;

        while (item) {
            if (0 >= limit) {
                this.truncate(item as E);
                return;
            }

            if (item.value) {
                limit--;
            }

            item = item.next; // next item
        }
    }

    /**
     * remove given item
     */

    delete(key: string): void {
        let prev: LinkedEnvelope<T>;
        let item: LinkedEnvelope<T> = this.get(key);
        if (!item) return;

        if (item.value) {
            delete this.items[item.key];
            this.size--;
            item.key = item.value = null;
        }

        while (item && !item.value) {
            if (prev) prev.next = item.next; // shortcut link
            prev = item;
            item = item.next; // next item
        }
    }

    /**
     * remove rest of items
     */

    truncate(value: E): void {
        let item = value as LinkedEnvelope<T>;

        while (item) {
            if (item.value) {
                delete this.items[item.key];
                this.size--;
                item.key = item.value = null;
            }

            const next = item.next; // next item
            item.next = null;
            item = next;
        }
    }

    /**
     * return an array containing all the elements in proper sequence
     */

    values(): E[] {
        const array: E[] = [];

        let item = this.last;
        while (item) {
            if (item.value) array.push(item as E);
            item = item.next;
        }

        // this.size = array.length;

        return array.reverse();
    }
}
