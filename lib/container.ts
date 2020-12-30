/**
 * container.ts
 */

type IContainer<T> = { [storageID: string]: T };

let storageID = 1;

export function clearContainers() {
    storageID++;
}

export function objectFactory<T>(fn: () => T): () => T {
    let container: IContainer<T>;

    return () => {
        return (container && container[storageID]) || ((container = {} as IContainer<T>)[storageID] = fn());
    };
}
