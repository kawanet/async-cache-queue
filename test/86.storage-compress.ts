#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../lib/async-cache-queue";
import {compressKVS} from "key-value-compress";

const TESTNAME = __filename.replace(/^.*\//, "");
const WAIT = (ms: number) => new Promise(resolve => setTimeout(() => resolve(ms), ms));

type Input = { input: string };
type Output = { output: string };

describe(TESTNAME, () => {
    it("compressKVS", async () => {
        let counter = 0;
        const testFn = (arg: Input): Promise<Output> => WAIT(1).then(() => counter++).then(() => {
            return {output: arg.input} as Output;
        });

        const map = new Map<string, any>();
        const storage = compressKVS<Output>({storage: map});
        const cached = queueFactory({storage})(testFn);

        assert.deepEqual((await cached({input: "foo"})), {output: "foo"});
        assert.equal(counter, 1);

        assert.deepEqual((await cached({input: "foo"})), {output: "foo"});
        assert.equal(counter, 1);

        assert.deepEqual((await cached({input: "bar"})), {output: "bar"});
        assert.equal(counter, 2);

        assert.deepEqual((await cached({input: "bar"})), {output: "bar"});
        assert.equal(counter, 2);
    });
});
