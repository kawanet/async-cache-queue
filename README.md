# async-cache-queue

Lightweight asynchronous task queue with cache, timeout and throttle management

[![Node.js CI](https://github.com/kawanet/async-cache-queue/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/kawanet/async-cache-queue/actions/)
[![npm version](https://badge.fury.io/js/async-cache-queue.svg)](https://www.npmjs.com/package/async-cache-queue)

## SYNOPSIS

```js
const {queueFactory, clearCache} = require("async-cache-queue");
const axios = require("axios");

const memoize = queueFactory({
    cache: 3600000, // 1 hour for results resolved
    refresh: 60000, // 1 min for pre-fetching next
    negativeCache: 1000, // 1 sec for errors rejected
    timeout: 10000, // 10 sec for force cancelation
    maxItems: 1000, // 1000 items in memory cache
    concurrency: 10, // 10 process throttled
});

const cacheGET = memoize(url => axios.get(url));

async function loadAPI() {
    const {data} = await cacheGET("https://example.com/api");
    return data;
}

// clear all caches when kill -HUP signal received.
process.on("SIGHUP", clearCache);
```

See TypeScript declaration
[async-cache-queue.d.ts](https://github.com/kawanet/async-cache-queue/blob/main/types/async-cache-queue.d.ts)
for more details.

## FEATURES

### Positive Caching and Throttling

Set `cache` option to enable the internal on-memory cache which stores `Promise` resolved by the given task.
Set `maxItems` option to limit the maximum number of cached items stored.
Set `concurrency` option to limit the maximum number of processes running in parallel.

```js
const memoTask = queueFactory({
    cache: 3600000, // 1 hour for results resolved
    maxItems: 1000, // 1000 items in memory cache
    concurrency: 10, // 10 process throttled
})(arg => runTask(arg));

const result = await memoTask(arg);
```

### Negative Caching and Cancellation

Set `negativeCache` to enable the internal on-memory cache which stores `Promise` rejected by the given task.
Set `timeout` to cancel the running function when its `Promise` keeps pending status for too long.
Those options work great for cases of network or system related troubles.

```js
const memoTask = queueFactory({
    negativeCache: 1000, // 1 sec for errors rejected
    timeout: 10000, // 10 sec for force cancelation
})(arg => runTask(arg));

memoTask(arg).catch(err => onFailure(err));
```

### Background Prefetching

Set longer `cache` and shorter `refresh` duration to minimize a delay to get results updated later.
It invokes pre-fetching request in background for the next coming request
if `refresh` milliseconds has past since the last result resolved.

```js
const memoTask = queueFactory({
    cache: 3600000, // 1 hour for results resolved
    refresh: 60000, // 1 min for pre-fetching next
})(arg => runTask(arg));

const val1 = await memoTask(); // this will wait until the first result resolved.

// few seconds later
const val2 = await memoTask(); // cached result (val2 === val1) returned without delay.

// few minutes later
const val3 = await memoTask(); // cached result (val3 === val1) returned without delay. pre-fetching started in background.

// few seconds later
const val4 = await memoTask(); // pre-fetched result (val4 !== val1) returned without outward delay.
```

### External Storage

Set `storage` option to enable the other external key-value storage such as
[Keyv](https://www.npmjs.com/package/keyv),
[key-value-compress](https://www.npmjs.com/package/key-value-compress), etc.
Instead of `Promise` returned, the resolved raw value is stored in the external storage.
Note that the cache TTL duration must be managed by the external storage.
`cache`, `maxItems` and `refresh` options do not affect to the external storage.

```js
const queueFactory = require("async-cache-queue").queueFactory;
const Keyv = require("keyv");
const KeyvMemcache = require("keyv-memcache");

const keyvStorage = new Keyv({
    store: new KeyvMemcache("localhost:11211"),
    namespace: "prefix:",
    ttl: 3600000, // 1 hour
});

const memoTask = queueFactory({
    storage: keyvStorage,
    negativeCache: 1000, // 1 sec for errors rejected
    timeout: 10000, // 10 sec for force cancelation
    concurrency: 10, // 10 process throttled
})(arg => runTask(arg));
```

`storage` option requires the interface of `get()` and `set()` methods implemented as below.

```typescript
interface KVS<T> {
    get(key: string): T | Promise<T>;
    set(key: string, value: T): void | Promise<void> | this;
}
```

### Global Erasure

Call `clearCache()` method to clear all items on the internal on-memory cache managed by the module by a single call.
Note that it doesn't affect to external `storage`s.

```js
const clearCache = require("async-cache-queue").clearCache;

// clear all caches when kill -HUP signal received.
process.on("SIGHUP", clearCache);
```

## LINKS

- https://github.com/kawanet/async-cache-queue
- https://www.npmjs.com/package/async-cache-queue

## MIT LICENSE

Copyright (c) 2020-2021 Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
