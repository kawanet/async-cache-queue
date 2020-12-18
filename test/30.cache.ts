#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {clearCache, queueFactory} from "../lib/async-cache-queue";

const TESTNAME = __filename.replace(/^.*\//, "");

const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));
const FAIL = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(ms), ms));

describe(TESTNAME, () => {
    {
        const opt = {cache: 150};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const wait = queueFactory(opt)(WAIT);
            const timer = createTimer(100);

            // execute first time
            assert.equal(await wait(100), 100);
            assert.equal(timer(), 100, "1. first execution");

            // return cache
            assert.equal(await wait(100), 100);
            assert.equal(timer(), 0, "2. cached");

            // execute second time
            assert.equal(await wait(200), 200);
            assert.equal(timer(), 200, "3. second execution");

            // execute third time
            assert.equal(await wait(100), 100);
            assert.equal(timer(), 100, "4. third execution");
        });
    }

    {
        const opt = {cache: 200};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const queue = queueFactory(opt);
            const timer = createTimer(100);

            let count = 0;
            const COUNT = queue((ms: number) => new Promise(resolve => setTimeout(() => resolve(count += ms), ms)));

            await Promise.all([
                COUNT(100),
                COUNT(100),
                COUNT(100),
                COUNT(100),
            ]);

            assert.equal(timer(), 100);
            assert.equal(count, 100);
        });
    }

    {
        const opt = {cache: 250};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const fail = queueFactory(opt)(FAIL);
            const timer = createTimer(100);

            // fail
            assert.equal(await fail(100).catch(e => e + 1), 101);
            assert.equal(timer(), 100);

            // fail again without cache
            assert.equal(await fail(100).catch(e => e + 2), 102);
            assert.equal(timer(), 100);
        });
    }

    {
        const opt = {cache: 100, negativeCache: 150};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const fail = queueFactory(opt)(FAIL);
            const timer = createTimer(100);

            // fail
            assert.equal(await fail(100).catch(e => e + 1), 101);
            assert.equal(timer(), 100);

            // fail with cache
            assert.equal(await fail(100).catch(e => e + 2), 102);
            assert.equal(timer(), 0);
        });
    }

    {
        const opt = {cache: 250, refresh: 150};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const queue = queueFactory(opt);
            const timer = createTimer(100);

            let c = 0;
            const count = queue((ms: number) => new Promise(resolve => setTimeout(() => resolve(c += ms), ms)));

            assert.equal(await count(100), 100, "1. created");
            assert.equal(timer(), 100, "1. created");

            assert.equal(await count(100), 100, "2. cache");
            assert.equal(timer(), 0, "2. cache");

            await WAIT(200);
            assert.equal(timer(), 200, "3. just waiting");

            assert.equal(await count(100), 100, "4. refreshing in background");
            assert.equal(timer(), 0, "4. refreshing in background");

            await WAIT(200);
            assert.equal(timer(), 200, "5. just waiting again");

            assert.equal(await count(100), 200, "6. refreshed in background");
            assert.equal(timer(), 0, "6. refreshed in background");

            assert.equal(await count(100), 200, "7. cached");
            assert.equal(timer(), 0, "7. cached");
        });
    }

    {
        const opt = {cache: -1, refresh: 50};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const queue = queueFactory(opt);
            const timer = createTimer(100);

            let c = 0;
            const count = queue((ms: number) => new Promise(resolve => setTimeout(() => resolve(c += ms), ms)));

            assert.equal(await count(100), 100);
            assert.equal(timer(), 100, "1. created");

            await WAIT(100);
            assert.equal(timer(), 100, "2. just waiting");

            assert.equal(await count(100), 100);
            assert.equal(timer(), 0, "3. cached");

            await WAIT(100);
            assert.equal(timer(), 100, "4. just waiting");

            assert.equal(await count(100), 200);
            assert.equal(timer(), 0, "5. refreshed in background");
        });
    }

    {
        const opt = {negativeCache: -1, refresh: 50};

        it(JSON.stringify(opt), async function () {
            this.timeout(1000);
            const queue = queueFactory(opt);
            const timer = createTimer(100);

            let c = 0;
            const count = queue((ms: number) => new Promise((resolve, reject) => setTimeout(() => reject(c += ms), ms)));

            assert.equal(await count(100).catch(e => e + 1), 101);
            assert.equal(timer(), 100, "1. created");

            await WAIT(100);
            assert.equal(timer(), 100, "2. just waiting");

            assert.equal(await count(100).catch(e => e + 2), 102);
            assert.equal(timer(), 0, "3. cached");

            await WAIT(100);
            assert.equal(timer(), 100, "4. just waiting");

            assert.equal(await count(100).catch(e => e + 3), 203);
            assert.equal(timer(), 0, "5. refreshed in background");
        });
    }

    {
        const opts = {cache: -1, negativeCache: -1};
        it(JSON.stringify(opts), async function () {
            this.timeout(1000);
            const queue = queueFactory(opts);

            let ok = 0;
            const OK = queue((inc: number) => new Promise(resolve => resolve(ok += inc)));
            let ng = 0;
            const NG = queue((inc: number) => new Promise((_, reject) => reject(ng += inc)));

            assert.equal(await OK(100), 100);
            assert.equal(await OK(100), 100);
            clearCache();

            assert.equal(await OK(100), 200);
            assert.equal(await OK(100), 200);
            clearCache();

            assert.equal(await NG(200).catch(e => e + 1), 201);
            assert.equal(await NG(200).catch(e => e + 2), 202);
            clearCache();

            assert.equal(await NG(200).catch(e => e + 3), 403);
            assert.equal(await NG(200).catch(e => e + 4), 404);
        });
    }

    {
        it("cache separation", async function () {
            this.timeout(1000);
            const queue = queueFactory({cache: -1});

            const Q1 = queue(async (v: number) => "Q1:" + v);
            const Q2 = queue(async (v: number) => "Q2:" + v);

            assert.equal(await Q1(100), "Q1:100");
            assert.equal(await Q2(200), "Q2:200");
            assert.equal(await Q1(200), "Q1:200");
            assert.equal(await Q2(100), "Q2:100");
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
