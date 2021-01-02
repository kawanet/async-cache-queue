/**
 * async-cache-queue.ts
 */

import {cacheFactory} from "./cache";
import {concurrencyFactory} from "./concurrency";
import {timeoutFactory} from "./timeout";
import {clearContainers} from "./container";

export interface QueueOptions<IN = any, OUT = any> {
    /**
     * Set a cache TTL in milliseconds since a succeeded result resolved.
     * The internal cache feature stores its value as a Promise but not resolved value.
     * Note that the TTL is applied only for the internal cache but not for external `storage`.
     * Set `-1` never to expire it.
     *
     * @default `0` to disable the cache.
     */

    cache?: number;

    /**
     * Set a negative cache TTL in milliseconds since a failed result rejected.
     * The internal cache feature stores its value as a Promise but not rejected reasons.
     * Note that the negative cache is only work with the internal cache but not with external `storage`.
     * Set `-1` not to expire it.
     *
     * @default `0` to disable the negative cache.
     */

    negativeCache?: number;

    /**
     * Set a refreshing interval in milliseconds.
     * It executes the function to fetch a new result in background for the next coming request.
     * Note that the last cached result is returned for the current running request.
     *
     * @default `0` to disables the feature.
     */

    refresh?: number;

    /**
     * Set a maximum number of items stored in the internal cache.
     * Note that the restriction is applied only for the internal cache but not for external `storage`.
     *
     * @default `0` to disables the restriction.
     */

    maxItems?: number;

    /**
     * Set a function to stringify cache key.
     *
     * @default: `(arg) => JSON.stringify(arg)`
     */

    hasher?: (arg: any) => string;

    /**
     * Set an external key-value storage adapter which has `.get(key)` and `.set(key, val)` methods.
     * Note that the `cache` option above does not affect for the external storage.
     * It needs to manage a proper expiration duration on the storage.
     *
     * @default `undefined` not to connect to any external storage.
     */

    storage?: KVS<OUT>;

    /**
     * Set a maximum limit number of concurrent working jobs.
     * The rest jobs will wait to start until another slot opened.
     *
     * @default `0` to disable the throttle feature.
     */

    concurrency?: number;

    /**
     * Set time in milliseconds to stop a long working unresolved job since it started.
     *
     * @default `0` to disable the timeout feature.
     */

    timeout?: number;

    /**
     * Set a function to resolve yet another fallback results,
     * instead of long working jobs which has exceeded `timeout` milliseconds.
     * Set `() => undefined` just to ignore the job.
     *
     * @default `() => Promise.reject(new Error("timeout: ${timeout}ms"));`
     */

    timeoutFallback?: (arg?: IN) => OUT;
}

/**
 * Interface for external key-value storage, e.g. https://www.npmjs.com/package/keyv
 *
 * Key is a string which hashed by the module.
 * Note that `null` and `undefined` value could not be cached via the external storage.
 * Use another value instead for the cases.
 */

export interface KVS<T = any> {
    get(key: string): T | Promise<T>;

    set(key: string, value: T): void | Promise<void> | this;
}

type FF<IN, OUT> = (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>));

/**
 * It returns a function to create a queue manager.
 */

export function queueFactory(options?: QueueOptions): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
    const {
        cache,
        concurrency,
        negativeCache,
        storage,
        timeout,
        timeoutFallback
    } = options || {} as QueueOptions;

    let flow: FF<any, any> = null;

    if (timeout) {
        flow = join(flow, timeoutFactory(timeout, timeoutFallback));
    }

    if (concurrency) {
        flow = join(flow, concurrencyFactory(concurrency));
    }

    if (cache || negativeCache || storage) {
        flow = join(flow, cacheFactory(options));
    }

    if (!flow) {
        flow = fn => arg => Promise.resolve().then(() => fn(arg))
    }

    return fn => flow(fn);
}

function join<IN, OUT>(prev: FF<IN, OUT>, filter: FF<IN, OUT>): FF<IN, OUT> {
    return (prev && filter) ? (fn => filter(prev(fn))) : (prev || filter);
}

/**
 * It purges all cache storage handled in the library.
 */

export function clearCache() {
    clearContainers();
}
