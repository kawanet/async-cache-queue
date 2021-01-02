#!/usr/bin/env mocha -R spec

/**
 * @example
 * docker run -d -p 11211:11211 --name memcached memcached
 * MEMCACHE_SERVERS=localhost:11211 mocha test/81.storage-keyv.js
 */

import {strict as assert} from "assert";
import {Store, Options} from "keyv";

import {KVS, queueFactory, QueueOptions} from "../lib/async-cache-queue";

const TESTNAME = __filename.replace(/^.*\//, "");
const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

// run this test only when environment variable specified
const {MEMCACHE_SERVERS} = process.env;
const DESCRIBE = MEMCACHE_SERVERS ? describe : describe.skip;

// an unique prefix added for test purpose
const PREFIX = TESTNAME + ":" + Date.now() + ":";

let onEnd: () => void;

DESCRIBE(TESTNAME, () => {
    after(() => onEnd && onEnd());

    {
        it("object", async function () {
            this.timeout(1000);

            let counter = 0;
            const testFn = <T>(arg: { input: T }): Promise<{ output: T }> => WAIT(1).then(() => counter++).then(() => {
                return {output: arg.input};
            });

            const options: QueueOptions = {
                storage: getKeyv("object")
            };

            const cached = queueFactory(options)(testFn);

            {
                assert.equal((await cached({input: "foo"}))?.output, "foo");
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal((await cached({input: "foo"}))?.output, "foo");
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal((await cached({input: 123}))?.output, 123);
                assert.equal(counter, 2);
                await WAIT(1);
            }
            {
                assert.equal((await cached({input: 123}))?.output, 123);
                assert.equal(counter, 2);
                await WAIT(1);
            }
        });
    }

    {
        it("string", async function () {
            this.timeout(1000);

            let counter = 0;
            const testFn = (num: number): Promise<string> => WAIT(1).then(() => counter++).then(() => "x".repeat(num));

            const options: QueueOptions = {
                storage: getKeyv("string")
            };

            const cached = queueFactory(options)(testFn);

            {
                assert.equal(await cached(5), "xxxxx");
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal(await cached(5), "xxxxx");
                assert.equal(typeof await cached(5), "string");
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal(await cached(0), "");
                assert.equal(counter, 2);
                await WAIT(1);
            }
            {
                assert.equal(await cached(0), "");
                assert.equal(typeof await cached(0), "string");
                assert.equal(counter, 2);
                await WAIT(1);
            }
        });
    }

    {
        it("number", async function () {
            this.timeout(1000);

            let counter = 0;
            const testFn = (num: number): Promise<number> => WAIT(1).then(() => counter++).then(() => num * 10);

            const options: QueueOptions = {
                storage: getKeyv("number")
            };

            const cached = queueFactory(options)(testFn);

            {
                assert.equal(await cached(100) + 1, 1000 + 1);
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal(await cached(100) + 2, 1000 + 2);
                assert.equal(typeof await cached(100), "number");
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal(await cached(0) + 3, 3);
                assert.equal(counter, 2);
                await WAIT(1);
            }
            {
                assert.equal(await cached(0) + 4, 4);
                assert.equal(typeof await cached(0), "number");
                assert.equal(counter, 2);
                await WAIT(1);
            }
        });
    }

    {
        it("boolean", async function () {
            this.timeout(1000);

            let counter = 0;
            const testFn = (num: number): Promise<boolean> => WAIT(1).then(() => counter++).then(() => !!(num % 2));

            const options: QueueOptions = {
                storage: getKeyv("boolean")
            };

            const cached = queueFactory(options)(testFn);

            {
                assert.equal(await cached(1), true);
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal(await cached(1), true);
                assert.equal(typeof await cached(1), "boolean");
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                assert.equal(await cached(2), false);
                assert.equal(counter, 2);
                await WAIT(1);
            }
            {
                assert.equal(await cached(2), false);
                assert.equal(typeof await cached(2), "boolean");
                assert.equal(counter, 2);
                await WAIT(1);
            }
        });
    }

    {
        it("Buffer", async function () {
            this.timeout(1000);

            let counter = 0;
            const testFn = (num: number): Promise<Buffer> => WAIT(1).then(() => counter++).then(() => Buffer.from([num]));

            const options: QueueOptions = {
                storage: getKeyv("Buffer")
            };

            const cached = queueFactory(options)(testFn);

            {
                const buffer = await cached(100);
                assert.ok(Buffer.isBuffer(buffer), "should be a Buffer");
                assert.equal(buffer[0] + 1, 100 + 1);
                assert.equal(counter, 1);
                await WAIT(1);
            }
            {
                const buffer = await cached(100);
                assert.ok(Buffer.isBuffer(buffer), "should be a Buffer");
                assert.equal(buffer[0] + 2, 100 + 2);
                assert.equal(counter, 1);
                await WAIT(1);
            }
        });
    }
});

let memcache: Store<any>;

function getKeyv<T = any>(namespace: string): KVS<T> {
    const Keyv = require('keyv');
    const KeyvMemcache = require('keyv-memcache');

    if (!memcache) {
        memcache = new KeyvMemcache(MEMCACHE_SERVERS);
        onEnd = () => (memcache as any).client.close();
    }

    const options: Options<T> = {
        namespace: PREFIX + namespace,
        store: memcache,
        ttl: 10000,
    };

    return new Keyv(options);
}