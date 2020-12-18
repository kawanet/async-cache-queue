/**
 * store-storage.ts
 */

export interface IItem {
    value: Promise<any>;
}

type IStorageData = { [key: string]: IItem };
type IStorageSet = { [seq: string]: IStorageData };

export interface IStorage {
    get(key: string): IItem;

    set(key: string, item: IItem): void;
}

let storageID = 1;

export function clearCache() {
    storageID++;
}

/**
 * Purge-able Storage
 */

export class DataStorage {
    private stores: IStorageSet;

    store(): IStorageData {
        return (this.stores && this.stores[storageID]) || ((this.stores = {} as IStorageSet)[storageID] = {});
    }
}

/**
 * /dev/null Storage
 */

export class NullStorage implements IStorage {

    get(key: string): IItem {
        return;
    }

    set(key: string, item: IItem): void {
        //
    }
}

/**
 * Persistent Storage
 */

export class SimpleStorage extends DataStorage implements IStorage {

    get(key: string): IItem {
        const store = this.store();
        return store[key];
    }

    set(key: string, item: IItem): void {
        const store = this.store();
        store[key] = item;
    }
}
