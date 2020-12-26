#!/usr/bin/env mocha -R spec

/**
 * @example
 * docker run -d -p 11211:11211 --name memcached memcached
 * MEMCACHE_SERVERS=localhost:11211 mocha test/32.storage-memjs
 */

import {strict as assert} from "assert";

import {queueFactory} from "../lib/async-cache-queue";

const TESTNAME = __filename.replace(/^.*\//, "");

interface IN {
    foo?: { bar?: number, buz?: number },
    qux?: number,
}

describe(TESTNAME, () => {
    it("JSON.stringify with replacer", async () => {
        const queue = queueFactory({
            cache: -1,
            hasher: (arg: IN) => JSON.stringify(arg, ["foo", "bar"])
        });

        let counter = 0;
        const COUNT = queue<IN, number>(async arg => (counter += arg.foo.bar));

        assert.equal(await COUNT({foo: {bar: 100, buz: 1}}) + 1, 101);
        assert.equal(await COUNT({foo: {bar: 100, buz: 1}}) + 2, 102);
        assert.equal(await COUNT({foo: {bar: 100, buz: 3}}) + 3, 103);
        assert.equal(await COUNT({foo: {bar: 100}, qux: 4}) + 4, 104);
        assert.equal(await COUNT({foo: {bar: 200, buz: 1}}) + 5, 305);
    });
});
