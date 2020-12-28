#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../lib/async-cache-queue";

const TESTNAME = __filename.replace(/^.*\//, "");
const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

describe(TESTNAME, () => {
    it("maxItems", async () => {
        const queue = queueFactory({
            cache: -1,
            maxItems: 5,
        });

        let counter = 0;
        const COUNT = queue<number, number>(async arg => (arg + (++counter)));

        assert.equal(await COUNT(100), 101);
        assert.equal(await COUNT(100), 101); // cached
        assert.equal(await COUNT(200), 202);
        assert.equal(await COUNT(100), 101); // still cached
        assert.equal(await COUNT(300), 303);
        assert.equal(await COUNT(100), 101); // still cached
        assert.equal(await COUNT(400), 404);
        assert.equal(await COUNT(100), 101); // still cached
        assert.equal(await COUNT(500), 505);
        assert.equal(await COUNT(100), 101); // still cached

        assert.equal(await COUNT(600), 606);
        assert.equal(await COUNT(600), 606); // cached

        await WAIT(10);

        assert.equal(await COUNT(100), 107); // refreshed
    });
});
