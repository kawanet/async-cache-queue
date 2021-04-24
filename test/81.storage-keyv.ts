#!/usr/bin/env mocha -R spec

/**
 * @example
 * docker run -d -p 11211:11211 --name memcached memcached
 * MEMCACHE_SERVERS=localhost:11211 mocha test
 */

import {strict as assert} from "assert";
import {Options} from "keyv";

import {queueFactory} from "../";
import {ACQ} from "../types/async-cache-queue";

const TITLE = __filename.split("/").pop();
const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

// run this test only when environment variable specified
const {MEMCACHE_SERVERS} = process.env;
const DESCRIBE = MEMCACHE_SERVERS ? describe : describe.skip;

// an unique prefix added for test purpose
const PREFIX = TITLE + ":" + Date.now() + ":";

DESCRIBE(TITLE, () => {
    const Keyv = require("keyv");
    const KeyvMemcache = require("keyv-memcache");
    const memcache = new KeyvMemcache(MEMCACHE_SERVERS);

    after(() => {
        (memcache as any).client.close();
    });

    {
        it("object", async function () {
            this.timeout(1000);

            let counter = 0;
            const testFn = <T>(arg: { input: T }): Promise<{ output: T }> => WAIT(1).then(() => counter++).then(() => {
                return {output: arg.input};
            });

            const storage = getKeyv("object");
            const cached = queueFactory({storage})(testFn);

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

            const storage = getKeyv("string");
            const cached = queueFactory({storage})(testFn);

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

            const storage = getKeyv("number");
            const cached = queueFactory({storage})(testFn);

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

            const storage = getKeyv("boolean");
            const cached = queueFactory({storage})(testFn);

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

            const storage = getKeyv("Buffer");
            const cached = queueFactory({storage})(testFn);

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

    function getKeyv<T = any>(namespace: string): ACQ.KVS<T> {
        const options: Options<T> = {
            namespace: PREFIX + namespace,
            store: memcache,
            ttl: 10000,
        };

        return new Keyv(options);
    }
});
