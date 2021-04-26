#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../";

const TITLE = __filename.split("/").pop();

describe(TITLE, () => {
    {
        it("without options", async function () {
            this.timeout(1000);
            const queue = queueFactory();

            // queue(fn)(arg) should returns a Promise
            assert.equal(typeof (queue(() => null)().then), "function", "queue(fn)(arg) should returns a Promise");

            // sync function
            assert.equal(await queue(((a: string) => a) as any)("sync"), "sync", "queue(fn) should accept sync function");

            // async function
            assert.equal(await queue(async (a: string) => a)("async"), "async");
        });
    }

    {
        it("invalid options", async function () {
            const NOP = async () => undefined as void;

            assert.throws(() => queueFactory({timeout: -1})(NOP));

            assert.throws(() => queueFactory({concurrency: -1})(NOP));

            assert.throws(() => queueFactory({cache: 1, refresh: -1})(NOP));

        });
    }
});
