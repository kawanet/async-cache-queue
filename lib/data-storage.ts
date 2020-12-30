/**
 * store-storage.ts
 */

export interface IItem {
    value: Promise<any>;
}

export interface IStorage<I extends IItem> {
    get(key: string): I;

    set(key: string, item: I): void;
}

/**
 * /dev/null Storage
 */

export class NullStorage<I extends IItem> implements IStorage<I> {

    get(key: string): I {
        return;
    }

    set(key: string, item: I): void {
        //
    }
}

/**
 * Persistent Storage
 */

export class SimpleStorage<I extends IItem> implements IStorage<I> {
    private items = {} as { [key: string]: I };

    get(key: string): I {
        return this.items[key];
    }

    set(key: string, item: I): void {
        this.items[key] = item;
    }
}
