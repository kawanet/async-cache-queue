/**
 * cache.ts
 */

import {QueueOptions} from "./async-cache-queue";
import {DataStorage, IItem, IStorage, NullStorage, SimpleStorage} from "./data-storage";
import {TimedStorage} from "./timed-storage";

interface CacheItem extends IItem {
    refresh?: number;
}

export function cacheFactory(options?: QueueOptions): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
    let {cache, hasher, negativeCache, refresh} = options;

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
        const pendItems = new DataStorage();

        // cache storage for resolved response
        const okItems = getStorage(cache);

        // cache storage for rejected response
        const ngItems = getStorage(negativeCache);

        return arg => {
            const key = hasher(arg);
            const pending = pendItems.store();
            return getItem().value;

            function getItem(): CacheItem {
                // read from cache
                const item: CacheItem = pending[key] || okItems.get(key) || ngItems.get(key);

                // run it and save to cache
                if (!item) {
                    return pending[key] = makeItem();
                }

                // refresh cache in background
                if (refresh && Date.now() > item.refresh) {
                    delete item.refresh;
                    makeItem();
                }

                return item;
            }

            function makeItem(): CacheItem {
                const item: CacheItem = {
                    value: Promise.resolve(arg).then(fn),
                };

                // unresolved cache could be refreshed
                if (refresh > 0) item.refresh = Date.now() + refresh;

                item.value.then(() => {
                    // save it when resolved
                    return okItems.set(key, item);
                }, () => {
                    // save it even when rejected
                    return ngItems.set(key, item);
                }).then(() => {
                    // the cache should be refreshed after given msec
                    if (refresh > 0) item.refresh = Date.now() + refresh;

                    // the cache is ready then
                    delete pending[key];
                });

                return item;
            }
        };
    }
}

function getStorage(cache: number): IStorage {
    if (cache > 0) return new TimedStorage(cache);
    if (cache < 0) return new SimpleStorage();
    return new NullStorage();
}