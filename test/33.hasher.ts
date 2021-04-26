#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";

import {queueFactory} from "../";

const TITLE = __filename.split("/").pop();

interface IN {
    foo?: { bar?: number, buz?: number },
    qux?: number,
}

describe(TITLE, () => {
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

    /**
     * https://www.npmjs.com/package/object-hash
     */

    it("object-hash with excludeKeys", async () => {
        const includeKeys: { [key: string]: number } = {foo: 1, bar: 1};

        const options = {
            excludeKeys: (key: string) => !includeKeys[key]
        };

        const hash = require("object-hash");

        const queue = queueFactory({
            cache: -1,
            hasher: (arg: IN) => hash(arg, options),
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
