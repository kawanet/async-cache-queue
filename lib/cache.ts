/**
 * cache.ts
 */

import {QueueOptions} from "./async-cache-queue";
import {IItem, IStorage, SimpleStorage} from "./data-storage";
import {TimedStorage} from "./timed-storage";
import {objectFactory} from "./container";

interface CacheItem extends IItem {
    refresh?: number;
}

type PendStorage = { [key: string]: CacheItem };

export function cacheFactory(options?: QueueOptions): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
    let {cache, hasher, maxItems, negativeCache, refresh, storage} = options;

    cache = +cache || 0;
    negativeCache = +negativeCache || 0;
    refresh = +refresh || 0;

    if (refresh < 0) {
        throw new Error("Invalid refresh: " + refresh);
    }

    if (hasher == null) {
        hasher = (arg: any) => JSON.stringify(arg);
    }

    if ("function" !== typeof hasher) {
        throw new Error("Invalid hasher: " + hasher);
    }

    return fn => {
        // pending items which are running and not stored in cache yet
        const pendItems = objectFactory(() => ({} as PendStorage)); // new Object()

        // cache storage for resolved response
        const okItems = getStorage<CacheItem>(cache, maxItems);

        // cache storage for rejected response
        const ngItems = getStorage<CacheItem>(negativeCache, maxItems);

        return arg => {
            const key = hasher(arg);
            const pending = pendItems();
            return getItem().value;

            function getItem(): CacheItem {
                // read from cache
                const item = pending[key] || (okItems && okItems().get(key)) || (ngItems && ngItems().get(key));

                // run it and save to cache
                if (!item) {
                    return pending[key] = makeItem();
                }

                // refresh cache in background for the next coming request
                if (refresh && Date.now() > item.refresh) {
                    delete item.refresh;
                    makeItem();
                }

                return item;
            }

            function makeItem(): CacheItem {
                const item: CacheItem = {
                    value: storage ? startWithStorage() : start()
                };

                // unresolved cache could be refreshed
                if (refresh > 0) item.refresh = Date.now() + refresh;

                item.value.then(() => {
                    // save it when resolved
                    if (okItems) return okItems().set(key, item);
                }, () => {
                    // save it even when rejected
                    if (ngItems) return ngItems().set(key, item);
                }).then(() => {
                    // the cache should be refreshed after given msec
                    if (refresh > 0) item.refresh = Date.now() + refresh;

                    // the cache is ready then
                    delete pending[key];
                });

                return item;
            }

            function start() {
                return Promise.resolve().then(() => fn(arg));
            }

            function startWithStorage() {
                return Promise.resolve().then(() => storage.get(key))
                    .then(cached => (cached != null) ? cached : fn(arg)
                        .then(result => (result == null) ? result :
                            Promise.resolve().then(() => storage.set(key, result)).then(() => result)));
            }
        };
    }
}

function getStorage<I extends IItem>(expires: number, maxItems: number): () => IStorage<I> {
    if (expires > 0 || maxItems > 0) return objectFactory(() => new TimedStorage<I>(expires, maxItems));
    if (expires < 0) return objectFactory(() => new SimpleStorage<I>());
}