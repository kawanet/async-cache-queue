#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {LinkedStorage} from "../lib/linked-storage";

const TESTNAME = __filename.replace(/^.*\//, "");

describe(TESTNAME, () => {
    it("set() and get()", async () => {
        const store = new LinkedStorage();

        store.set("foo", {value: Promise.resolve("FOO")});
        assert.equal(await store.get("foo")?.value, "FOO");

        assert.equal(await store.get("bar")?.value, undefined);

        store.set("buz", {value: Promise.resolve("BUZ-1")});
        store.set("buz", {value: Promise.resolve("BUZ-2")});
        assert.equal(await store.get("buz")?.value, "BUZ-2");

        const array = await Promise.all(store.toArray().map(item => item.value));
        assert.deepEqual(array, ["FOO", "BUZ-2"]);
    });

    it("limit()", async () => {
        const store = new LinkedStorage();

        store.set("1", {value: Promise.resolve(1)});
        store.set("2", {value: Promise.resolve(2)});
        store.set("3", {value: Promise.resolve(3)});
        store.set("4", {value: Promise.resolve(4)});
        store.set("5", {value: Promise.resolve(5)});

        assert.equal(await store.get("1")?.value, 1);
        assert.equal(await store.get("2")?.value, 2);
        assert.equal(await store.get("3")?.value, 3);
        assert.equal(await store.get("4")?.value, 4);
        assert.equal(await store.get("5")?.value, 5);

        store.limit(3);

        assert.equal(await store.get("1")?.value, undefined);
        assert.equal(await store.get("2")?.value, undefined);
        assert.equal(await store.get("3")?.value, 3);
        assert.equal(await store.get("4")?.value, 4);
        assert.equal(await store.get("5")?.value, 5);

        const array = await Promise.all(store.toArray().map(item => item.value));
        assert.deepEqual(array, [3, 4, 5]);
    });
});
