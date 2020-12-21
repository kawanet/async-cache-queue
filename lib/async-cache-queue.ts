/**
 * async-cache-queue.ts
 */

import {cacheFactory} from "./cache";
import {concurrencyFactory} from "./concurrency";
import {timeoutFactory} from "./timeout";
import {clearCache as _clearCache} from "./data-storage";

export interface QueueOptions {
    cache?: number;
    negativeCache?: number;
    refresh?: number;
    hasher?: (arg: any) => string;
    storage?: KVS;
    concurrency?: number;
    timeout?: number;
    timeoutFallback?: (arg?: any) => any;
}

export interface KVS<T = any> {
    get(key: string): Promise<T>;

    set(key: string, value: T): Promise<void>;
}

type FF<IN, OUT> = (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>));

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
        flow = fn => arg => Promise.resolve(arg).then(fn)
    }

    return fn => flow(fn);
}

function join<IN, OUT>(prev: FF<IN, OUT>, filter: FF<IN, OUT>): FF<IN, OUT> {
    return (prev && filter) ? (fn => filter(prev(fn))) : (prev || filter);
}

export const clearCache = _clearCache;
