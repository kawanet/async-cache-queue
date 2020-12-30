# async-cache-queue

Lightweight asynchronous task queue with cache, timeout and throttle management

[![Node.js CI](https://github.com/kawanet/async-cache-queue/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/kawanet/async-cache-queue/actions/)
[![npm version](https://badge.fury.io/js/async-cache-queue.svg)](https://www.npmjs.com/package/async-cache-queue)

## SYNOPSIS

```js
const {queueFactory, clearCache} = require("async-cache-queue");
const axios = require("axios");

const enableCache = queueFactory({
    cache: 3600000, // 1 hour for results resolved
    refresh: 60000, // 1 min for pre-fetching next
    negativeCache: 1000, // 1 sec for errors rejected
    timeout: 10000, // 10 sec for force cancelation
    maxItems: 1000, // 1000 items in memory cache
    concurrency: 10, // 10 process throttled
});

const cachedGET = enableCache(url => axios.get(url));

async function loadAPI() {
    const {data} = await cachedGET("https://example.com/api");
    return data;
}

// clear all caches when kill -HUP signal received.
process.on("SIGHUP", clearCache);
```

See TypeScript declaration
[async-cache-queue.d.ts](https://github.com/kawanet/async-cache-queue/blob/master/types/async-cache-queue.d.ts)
for more details.

## FEATURES

### Positive Caching and Throttling

Set `cache` option to enable the internal on-memory cache which stores `Promise` resolved by the given task.
Set `maxItems` option to limit the maximum number of cached items stored.
Set `concurrency` option to limit the maximum number of processes running in parallel.

```js
const cachedTask = queueFactory({
    cache: 3600000, // 1 hour for results resolved
    maxItems: 1000, // 1000 items in memory cache
    concurrency: 10, // 10 process throttled
})(arg => runTask(arg));

const result = await cachedTask(arg);
```

### Negative Caching and Cancellation

Set `negativeCache` to enable the internal on-memory cache which stores `Promise` rejected by the given task.
Set `timeout` to cancel the running function when its `Promise` keeps pending status for too long.
Those options work great for cases of network or system related troubles.

```js
const cachedTask = queueFactory({
    negativeCache: 1000, // 1 sec for errors rejected
    timeout: 10000, // 10 sec for force cancelation
})(arg => runTask(arg));
```

### Background Prefetching

Set longer `cache` and shorter `refresh` duration to minimize a delay to get results updated later.
It invokes pre-fetching request in background for the next coming request
if `refresh` milliseconds has past since the last result resolved.

```js
const cachedTask = queueFactory({
    cache: 3600000, // 1 hour for results resolved
    refresh: 60000, // 1 min for pre-fetching next
})(arg => runTask(arg));

const val1 = await cachedGET(); // this will wait until the first result resolved.

// few seconds later
const val2 = await cachedGET(); // cached result (val2 === val1) returned without delay.

// few minutes later
const val3 = await cachedGET(); // cached result (val3 === val1) returned without delay. pre-fetching started in background.

// few seconds later
const val4 = await cachedGET(); // pre-fetched result (val4 !== val1) returned without outward delay.
```

### External Storage

Set `storage` option to enable the other external key-value storage such as
[Keyv](https://www.npmjs.com/package/keyv).
Instead of `Promise` returned, the resolved raw value will be stored in the external storage.
Note that the cache TTL duration must be managed by the external storage.
`storage` option requires the interface of `get()` and `set()` methods implemented.

```js
const queueFactory = require("async-cache-queue").queueFactory;
const Keyv = require("keyv");
const KeyvMemcache = require("keyv-memcache");

const keyvStorage = new Keyv({
    store: new KeyvMemcache("localhost:11211"),
    namespace: "prefix:",
    ttl: 3600000, // 1 hour
});

const cachedTask = queueFactory({
    storage: keyvStorage,
    negativeCache: 1000, // 1 sec for errors rejected
    timeout: 10000, // 10 sec for force cancelation
    concurrency: 10, // 10 process throttled
})(arg => runTask(arg));
```

### Global Erasure

Call `clearCache()` method to clear all internal caches managed by the module by a single call.
Note that it doesn't affect to external caches managed by `storage`.

```js
const clearCache = require("async-cache-queue").clearCache;

// clear all caches when kill -HUP signal received.
process.on("SIGHUP", clearCache);
```

## MIT LICENSE

Copyright (c) 2020 Yusuke Kawasaki

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
