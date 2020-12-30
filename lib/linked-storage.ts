import {IItem} from "./data-storage";

interface LinkedItem extends IItem {
    key?: string;
    next?: LinkedItem;
}

export class LinkedStorage<I extends IItem> {
    private last: LinkedItem = null;
    private items = {} as { [key: string]: LinkedItem };
    private size: number = 0;
    private maxItems: number;

    constructor(maxItems: number) {
        this.maxItems = (maxItems > 0) && +maxItems || 0;
    }

    get(key: string): I {
        const item = this.items[key];
        if (item?.value) return item as I;
    }

    set(key: string, value: I): void {
        const item = value as LinkedItem;

        // remove duplicated item
        const dup: LinkedItem = this.get(key);
        if (dup) {
            this.remove(dup);
        }

        this.items[key] = item;
        this.size++;
        item.key = key;

        // append at the end of the linked list
        const last = this.last;
        if (last) {
            item.next = last.value ? last : last.next;
        }
        this.last = item;

        const {maxItems} = this;
        if (maxItems && this.size > maxItems) {
            this.limit(maxItems);
        }
    }

    /**
     * restrict maximum number of items
     * it costs O(n) as parsing whole of items
     */

    private limit(limit: number): void {
        let item = this.last;

        while (item) {
            if (0 >= limit) {
                this.truncate(item);
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

    private remove(item: LinkedItem): void {
        let prev: LinkedItem;

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

    protected truncate(item: LinkedItem): void {
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
}
