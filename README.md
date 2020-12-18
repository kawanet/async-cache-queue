# async-cache-queue

Lightweight async task queue with cache, timeout and throttle management

[![Node.js CI](https://github.com/kawanet/async-cache-queue/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/kawanet/async-cache-queue/actions/)
[![npm version](https://badge.fury.io/js/async-cache-queue.svg)](https://www.npmjs.com/package/async-cache-queue)

## SYNOPSIS

```js
const {queueFactory, clearCache} = require("async-cache-queue");
const axios = require("axios");

const makeQ = queueFactory({
  cache: 3600000, // 1 hour
  refresh: 60000, // 1 min
  negativeCache: 1000, // 1 sec
  timeout: 10000, // 10 sec
  concurrency: 10,
});

const getQ = makeQ(url => axios.get(url));

async function loadAPI() {
  const {data} = await getQ("https://example.com/api");
  return data;
}

// clear cache when kill -HUP signal received.
process.on("SIGHUP", clearCache);
```

See TypeScript declaration
[async-cache-queue.d.ts](https://github.com/kawanet/async-cache-queue/blob/master/types/async-cache-queue.d.ts)
for more detail.

## MIT License

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
