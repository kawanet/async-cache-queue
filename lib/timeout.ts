/**
 * timeout.ts
 */

export function timeoutFactory(timeout: number, fallback?: (arg?: any) => any): (<IN, OUT>(fn: ((arg?: IN) => Promise<OUT>)) => ((arg?: IN) => Promise<OUT>)) {
    if (!(timeout > 0)) {
        throw new Error("Invalid timeout: " + timeout);
    }

    if (fallback == null) {
        fallback = () => Promise.reject(new Error("timeout: " + timeout + "ms"));
    }

    if ("function" !== typeof fallback) {
        throw new Error("Invalid timeoutFallback: " + fallback);
    }

    return fn => arg => new Promise((resolve, reject) => {
        let count = 0;

        let timer = setTimeout(() => {
            timer = null;
            if (!count++) return Promise.resolve(arg).then(fallback).then(resolve, reject);
        }, timeout);

        Promise.resolve(arg).then(fn).then(result => {
            if (timer) clearTimeout(timer);
            if (!count++) resolve(result);
        }, reason => {
            if (timer) clearTimeout(timer);
            if (!count++) reject(reason);
        });
    });
}