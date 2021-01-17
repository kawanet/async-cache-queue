#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {LinkedStorage} from "../lib/linked-storage";

const TESTNAME = __filename.replace(/^.*\//, "");

describe(TESTNAME, () => {
    it("set() and get()", async () => {
        const store = new LinkedStorage();
        assert.deepEqual(await getArray(store), []);

        store.setItem("foo", {value: Promise.resolve("FOO")});
        assert.equal(await store.getItem("foo")?.value, "FOO");
        assert.deepEqual(await getArray(store), ["FOO"]);

        assert.equal(await store.getItem("bar")?.value, undefined);

        store.setItem("buz", {value: Promise.resolve("BUZ-1")});
        store.setItem("buz", {value: Promise.resolve("BUZ-2")});
        assert.equal(await store.getItem("buz")?.value, "BUZ-2");
        assert.deepEqual(await getArray(store), ["FOO", "BUZ-2"]);
    });

    it("limit()", async () => {
        const store = new LinkedStorage();

        store.setItem("1", {value: Promise.resolve(1)});
        store.setItem("2", {value: Promise.resolve(2)});
        store.setItem("3", {value: Promise.resolve(3)});
        store.setItem("4", {value: Promise.resolve(4)});
        store.setItem("5", {value: Promise.resolve(5)});

        assert.equal(await store.getItem("1")?.value, 1);
        assert.equal(await store.getItem("2")?.value, 2);
        assert.equal(await store.getItem("3")?.value, 3);
        assert.equal(await store.getItem("4")?.value, 4);
        assert.equal(await store.getItem("5")?.value, 5);
        assert.deepEqual(await getArray(store), [1, 2, 3, 4, 5]);

        store.shrink(3);

        assert.equal(await store.getItem("1")?.value, undefined);
        assert.equal(await store.getItem("2")?.value, undefined);
        assert.equal(await store.getItem("3")?.value, 3);
        assert.equal(await store.getItem("4")?.value, 4);
        assert.equal(await store.getItem("5")?.value, 5);
        assert.deepEqual(await getArray(store), [3, 4, 5]);
    });

    it("remove()", async () => {
        const store = new LinkedStorage();

        store.setItem("1", {value: Promise.resolve(1)});
        store.setItem("2", {value: Promise.resolve(2)});
        store.setItem("3", {value: Promise.resolve(3)});
        store.setItem("4", {value: Promise.resolve(4)});
        store.setItem("5", {value: Promise.resolve(5)});

        assert.deepEqual(await getArray(store), [1, 2, 3, 4, 5]);

        store.delete("1");
        assert.equal(await store.getItem("1")?.value, undefined);
        assert.deepEqual(await getArray(store), [2, 3, 4, 5]);

        store.delete("5");
        assert.equal(await store.getItem("5")?.value, undefined);
        assert.deepEqual(await getArray(store), [2, 3, 4]);

        store.delete("3");
        assert.equal(await store.getItem("3")?.value, undefined);
        assert.deepEqual(await getArray(store), [2, 4]);

        store.delete("2");
        assert.equal(await store.getItem("2")?.value, undefined);
        assert.deepEqual(await getArray(store), [4]);

        store.delete("4");
        assert.equal(await store.getItem("4")?.value, undefined);
        assert.deepEqual(await getArray(store), []);
    });
});

async function getArray<T = any>(store: LinkedStorage<any>): Promise<T[]> {
    return Promise.all(store.values().map(item => item.value));
}