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
    concurrency?: number;
    timeout?: number;
    timeoutFallback?: (arg?: any) => any;
}

type FF<IN, OUT> = (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>));

export function queueFactory(options?: QueueOptions): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
    const {
        cache,
        concurrency,
        negativeCache,
        refresh,
        timeout,
        timeoutFallback
    } = options || {} as QueueOptions;

    const timeoutFn = timeout && timeoutFactory(timeout, timeoutFallback);
    const concurrencyFn = concurrency && concurrencyFactory(concurrency);
    const cacheFn = (cache || negativeCache || refresh) && cacheFactory(options);

    return fn => {
        let flow: FF<any, any> = null;

        flow = join(flow, timeoutFn);
        flow = join(flow, concurrencyFn);
        flow = join(flow, cacheFn);

        if (!flow) flow = fn => arg => Promise.resolve(arg).then(fn)

        return flow(fn);
    }
}

function join<IN, OUT>(prev: FF<IN, OUT>, filter: FF<IN, OUT>): FF<IN, OUT> {
    return (prev && filter) ? (fn => filter(prev(fn))) : (prev || filter);
}

export const clearCache = _clearCache;
