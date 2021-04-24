/**
 * cache.ts
 */

import {ACQ} from "../types/async-cache-queue";
import {Envelope, EnvelopeKVS, SimpleStorage} from "./data-storage";
import {TimedKVS} from "timed-kvs";
import {objectFactory} from "./container";

interface Item<T> extends Envelope<T> {
    refresh?: number;
}

type PendStorage<T> = { [key: string]: Item<T> };

export function cacheFactory(options?: ACQ.Options): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
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

    return <IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => {
        // pending items which are running and not stored in cache yet
        const pendItems = objectFactory(() => ({} as PendStorage<Promise<OUT>>)); // new Object()

        // cache storage for resolved response
        const okItems = getStorage<Promise<OUT>>(cache, maxItems);

        // cache storage for rejected response
        const ngItems = getStorage<Promise<OUT>>(negativeCache, maxItems);

        return (arg?: IN): Promise<OUT> => {
            const key = hasher(arg);
            const pending = pendItems();
            return getItem().value;

            function getItem(): Item<Promise<OUT>> {
                // read from cache
                const item: Item<Promise<OUT>> = pending[key] || (okItems && okItems().getItem(key)) || (ngItems && ngItems().getItem(key));

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

            function makeItem(): Item<Promise<OUT>> {
                const item: Item<Promise<OUT>> = {
                    value: storage ? startWithStorage() : start()
                };

                // unresolved cache could be refreshed
                if (refresh > 0) item.refresh = Date.now() + refresh;

                item.value.then(() => {
                    // save it when resolved
                    if (okItems) return okItems().setItem(key, item);
                }, () => {
                    // save it even when rejected
                    if (ngItems) return ngItems().setItem(key, item);
                }).then(() => {
                    // the cache should be refreshed after given msec
                    if (refresh > 0) item.refresh = Date.now() + refresh;

                    // the cache is ready then
                    delete pending[key];
                });

                return item;
            }

            // run the job without external storage
            function start() {
                return Promise.resolve().then(() => fn(arg));
            }

            // run the job with external storage
            function startWithStorage() {
                return Promise.resolve().then(() => storage.get(key)).then(cached => {
                    if (cached != null) return cached;
                    return Promise.resolve().then(() => fn(arg)).then(result => {
                        if (result == null) return result;
                        return Promise.resolve().then(() => storage.set(key, result)).then(() => result)
                    });
                });
            }
        };
    }
}

function getStorage<T>(expires: number, maxItems: number): () => EnvelopeKVS<T> {
    if (expires > 0 || maxItems > 0) return objectFactory(() => new TimedKVS<T>({expires, maxItems}));
    if (expires < 0) return objectFactory(() => new SimpleStorage<T>());
}