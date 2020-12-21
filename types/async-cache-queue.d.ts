/**
 * async-cache-queue.ts
 */
export interface QueueOptions {
    /**
     * Set cache TTL in milliseconds since a succeeded result resolved.
     * Set `-1` not to expire it.
     *
     * Default: `0` means to disable the cache.
     */
    cache?: number;
    /**
     * Set negative cache TTL in milliseconds since a failed result rejected.
     * Set `-1` not to expire it.
     *
     * Default: `0` means to disable the negative cache.
     */
    negativeCache?: number;
    /**
     * Set refresh interval in milliseconds.
     * It executes the function to fetch a new result in background for the next coming request.
     * Note tha the last cached result is returned for the current running request.
     *
     * Default: `0` means to disable the pre-fetch feature.
     */
    refresh?: number;
    /**
     * Set a function to stringify cache key.
     *
     * Default: `JSON.stringify()`
     */
    hasher?: (arg: any) => string;
    /**
     * Set an external key-value storage adapter which has `.get(key)` and `.set(key, val)` methods.
     * Note that the `cache` option above does not affect for the external storage.
     * It needs to manage a proper expiration duration on the storage.
     */
    storage?: KVS;
    /**
     * Set a maximum limit number of concurrent working jobs.
     * The rest jobs will wait to start until another slot opened.
     *
     * Default: `0` means to disable the throttle feature.
     */
    concurrency?: number;
    /**
     * Set time in milliseconds to stop a long working unresolved job since it started.
     *
     * Default: `0` means to disable the timeout feature.
     */
    timeout?: number;
    /**
     * Set a function to resolve yet another fallback results,
     * instead of long working jobs which has exceeded `timeout` milliseconds.
     * Set `() => undefined` just to ignore the job.
     *
     * Default: `() => Promise.reject(new Error("timeout: ${timeout}ms"));`
     */
    timeoutFallback?: (arg?: any) => any;
}
/**
 * Interface for external key-value storage, e.g. https://www.npmjs.com/package/keyv
 *
 * Key is a string which hashed by the module.
 * Note that `null` and `undefined` value could not be cached via the external storage.
 * Use another value instead for the cases.
 */
export interface KVS<T = any> {
    get(key: string): Promise<T>;
    set(key: string, value: T): Promise<void>;
}
/**
 * It returns a function to create a queue manager.
 */
export declare function queueFactory(options?: QueueOptions): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>));
/**
 * It purges all cache storage handled in the library.
 */
export declare function clearCache(): void;
