#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../lib/async-cache-queue";

const TESTNAME = __filename.replace(/^.*\//, "");

const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

describe(TESTNAME, () => {
    {
        const opt = {timeout: 200, timeoutFallback: () => "TIMEOUT"};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const wait = queueFactory(opt)(WAIT);
            const timer = createTimer(100);

            // 00:00.000 - 100 success
            assert.equal(await wait(100), 100);
            assert.equal(timer(), 100);

            // 00:00.100 - 300 timeout
            assert.equal(await wait(300), "TIMEOUT");
            assert.equal(timer(), 200);
        });
    }

    {
        const opt = {timeout: 300};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const wait = queueFactory(opt)(WAIT);
            const timer = createTimer(100);

            // 00:00.000 - 200 success
            await wait(200);
            assert.equal(timer(), 200);

            // 00:00.200 - 500 timeout
            let err: Error = null;
            await wait(400).catch(e => (err = e));
            assert.equal(timer(), 300);

            assert.equal(err?.message, "timeout: 300ms");
        });
    }
});

function createTimer(ms?: number) {
    let prev = Date.now();

    return () => {
        const now = Date.now();
        const diff = now - prev;
        prev = now;
        return ms ? Math.round(diff / ms) * ms : diff;
    }
}
