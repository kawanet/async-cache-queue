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
        const COUNT = queue<string, string>(async key => `${key}:${++counter}`);

        assert.equal(await COUNT("foo"), "foo:1");
        assert.equal(await COUNT("bar"), "bar:2");
        assert.equal(await COUNT("buz"), "buz:3");
        assert.equal(await COUNT("qux"), "qux:4");
        assert.equal(await COUNT("quux"), "quux:5");

        // check cached values
        assert.equal(await COUNT("foo"), "foo:1"); // cached
        assert.equal(await COUNT("bar"), "bar:2");
        assert.equal(await COUNT("buz"), "buz:3");
        assert.equal(await COUNT("qux"), "qux:4");
        assert.equal(await COUNT("quux"), "quux:5");

        // this exceeds maxItems limit and removes "foo" then
        assert.equal(await COUNT("corge"), "corge:6");
        assert.equal(await COUNT("corge"), "corge:6"); // cached

        // wait a moment for garbage collection completed
        await WAIT(1001);

        // this refreshes "foo" and removes "bar" then
        assert.equal(await COUNT("foo"), "foo:7"); // refreshed
        assert.equal(await COUNT("foo"), "foo:7"); // cached

        // assert.equal(COUNT("bar"), "bar:8"); // removed
        assert.equal(await COUNT("buz"), "buz:3");

        assert.equal(await COUNT("buz"), "buz:3");
        assert.equal(await COUNT("qux"), "qux:4");
        assert.equal(await COUNT("quux"), "quux:5");
    });
});
