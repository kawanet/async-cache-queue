/**
 * store-storage.ts
 */

export interface IItem {
    value: Promise<any>;
}

type IStorageData<I> = { [key: string]: I };
type IStorageSet<I> = { [storageID: string]: IStorageData<I> };

export interface IStorage<I extends IItem> {
    get(key: string): I;

    set(key: string, item: I): void;
}

let storageID = 1;

export function clearCache() {
    storageID++;
}

/**
 * Purge-able Storage
 */

export class DataStorage<I> {
    private stores: IStorageSet<I>;

    store(): IStorageData<I> {
        return (this.stores && this.stores[storageID]) || ((this.stores = {} as IStorageSet<I>)[storageID] = {});
    }
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

export class SimpleStorage<I extends IItem> extends DataStorage<I> implements IStorage<I> {

    get(key: string): I {
        const store = this.store();
        return store[key];
    }

    set(key: string, item: I): void {
        const store = this.store();
        store[key] = item;
    }
}
