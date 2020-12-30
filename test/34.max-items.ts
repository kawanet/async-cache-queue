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
        assert.equal(await COUNT(200), 202);
        assert.equal(await COUNT(300), 303);
        assert.equal(await COUNT(400), 404);
        assert.equal(await COUNT(500), 505);

        // check cached values
        assert.equal(await COUNT(100), 101); // cached
        assert.equal(await COUNT(200), 202);
        assert.equal(await COUNT(300), 303);
        assert.equal(await COUNT(400), 404);
        assert.equal(await COUNT(500), 505);

        // this exceeds maxItems limit and removes 100 then
        assert.equal(await COUNT(600), 606);
        assert.equal(await COUNT(600), 606); // cached

        // wait a moment for garbage collection completed
        await WAIT(10);

        // this refreshes 100 and removes 200 then
        assert.equal(await COUNT(100), 107); // refreshed

        // check cached values
        assert.equal(await COUNT(100), 107); // cached
        // assert.equal(await COUNT(200), 202); // removed
        assert.equal(await COUNT(300), 303);
        assert.equal(await COUNT(400), 404);
        assert.equal(await COUNT(500), 505);
        assert.equal(await COUNT(600), 606);
    });
});
