/**
 * cache.ts
 */

import {QueueOptions} from "../types/async-cache-queue";
import {Envelope, EnvelopeKVS, SimpleStorage} from "./data-storage";
import {TimedStorage} from "./timed-storage";
import {objectFactory} from "./container";

interface Item<T> extends Envelope<Promise<T>> {
    refresh?: number;
}

type PendStorage<T> = { [key: string]: Item<T> };

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

    return <IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => {
        // pending items which are running and not stored in cache yet
        const pendItems = objectFactory(() => ({} as PendStorage<OUT>)); // new Object()

        // cache storage for resolved response
        const okItems = getStorage<Item<OUT>>(cache, maxItems);

        // cache storage for rejected response
        const ngItems = getStorage<Item<OUT>>(negativeCache, maxItems);

        return (arg?: IN): Promise<OUT> => {
            const key = hasher(arg);
            const pending = pendItems();
            return getItem().value;

            function getItem(): Item<OUT> {
                // read from cache
                const item: Item<OUT> = pending[key] || (okItems && okItems().get(key)) || (ngItems && ngItems().get(key));

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

            function makeItem(): Item<OUT> {
                const item: Item<OUT> = {
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

function getStorage<E extends Envelope<any>>(expires: number, maxItems: number): () => EnvelopeKVS<E> {
    if (expires > 0 || maxItems > 0) return objectFactory(() => new TimedStorage<E>(expires, maxItems));
    if (expires < 0) return objectFactory(() => new SimpleStorage<E>());
}