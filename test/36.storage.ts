#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../lib/async-cache-queue";

const TESTNAME = __filename.replace(/^.*\//, "");
const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

type Input = { input: string };
type Output = { output: string };

describe(TESTNAME, () => {
    it("Map", async () => {
        let counter = 0;
        const testFn = (arg: Input): Promise<Output> => WAIT(1).then(() => counter++).then(() => {
            return {output: arg.input} as Output;
        });

        const storage = new Map<string, Output>();
        const cached = queueFactory({storage})(testFn);

        assert.deepEqual((await cached({input: "foo"})), {output: "foo"});
        assert.deepEqual(storage.values().next().value, {output: "foo"});
        assert.equal(counter, 1);

        assert.deepEqual((await cached({input: "foo"})), {output: "foo"});
        assert.equal(counter, 1);

        assert.deepEqual((await cached({input: "bar"})), {output: "bar"});
        assert.equal(counter, 2);

        assert.deepEqual((await cached({input: "bar"})), {output: "bar"});
        assert.equal(counter, 2);
    });
});
