/**
 * async-cache-queue.ts
 */

import {cacheFactory} from "./cache";
import {concurrencyFactory} from "./concurrency";
import {timeoutFactory} from "./timeout";
import {clearContainers} from "./container";
import {KVS, QueueOptions} from "../types/async-cache-queue";
export {KVS, QueueOptions};

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
