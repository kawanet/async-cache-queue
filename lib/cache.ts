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
    let {cache, hasher, negativeCache, refresh, storage} = options;

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
        const pendItems = new DataStorage<CacheItem>();

        // cache storage for resolved response
        const okItems = getStorage<CacheItem>(cache);

        // cache storage for rejected response
        const ngItems = getStorage<CacheItem>(negativeCache);

        return arg => {
            const key = hasher(arg);
            const pending = pendItems.store();
            return getItem().value;

            function getItem(): CacheItem {
                // read from cache
                const item = pending[key] || okItems.get(key) || ngItems.get(key);

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
                    value: storage ? startWithStorage() : start()
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

            function start() {
                return Promise.resolve(arg).then(fn);
            }

            function startWithStorage() {
                return Promise.resolve().then(() => storage.get(key))
                    .then(cached => (cached != null) ? cached : start()
                        .then(result => (result == null) ? result :
                            Promise.resolve().then(() => storage.set(key, result)).then(() => result)));
            }
        };
    }
}

function getStorage<I extends IItem>(cache: number): IStorage<I> {
    if (cache > 0) return new TimedStorage<I>(cache);
    if (cache < 0) return new SimpleStorage<I>();
    return new NullStorage<I>();
}