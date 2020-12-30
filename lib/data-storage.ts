/**
 * store-storage.ts
 */
import {objectFactory} from "./container";

export interface IItem {
    value: Promise<any>;
}

type IStorageData<I> = { [key: string]: I };

export interface IStorage<I extends IItem> {
    get(key: string): I;

    set(key: string, item: I): void;
}

export class DataStorage<I> {
    store = objectFactory(() => ({} as IStorageData<I>));
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
