#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../";

const TITLE = __filename.split("/").pop();

const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

describe(TITLE, () => {
    {
        const opt = {concurrency: 1};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const wait = queueFactory(opt)(WAIT);
            const timer = createTimer(100);

            // 00:00.000 - 200 WAIT
            await wait(200);
            assert.equal(timer(), 200);

            // 00:00.200 - 400 WAIT
            await wait(200);
            assert.equal(timer(), 200);
        });
    }

    {
        const opt = {concurrency: 3};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const wait = queueFactory(opt)(WAIT);
            const timer = createTimer(100);

            await Promise.all([
                // 00:00.000 - 200 WAIT
                wait(200),
                wait(200),
                wait(200),
            ]);

            assert.equal(timer(), 200);
        });
    }

    {
        const opt = {concurrency: 2, timeout: 200};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const wait = queueFactory(opt)(WAIT);
            const timer = createTimer(100);
            let err: Error = null;

            await Promise.all([
                // 00:00.000 - 100 success
                wait(100).catch(e => (err = e)),

                // 00:00.000 - 200 timeout
                wait(300).catch(e => (err = e)),
            ]);

            assert.equal(timer(), 200);
            assert.equal(err?.message, "timeout: 200ms");
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
