#!/usr/bin/env mocha -R spec

import {strict as assert} from "assert";
import {LinkedStorage} from "../lib/linked-storage";

const TESTNAME = __filename.replace(/^.*\//, "");

describe(TESTNAME, () => {
    it("set() and get()", async () => {
        const store = new LinkedStorage<Promise<string>>();
        assert.deepEqual(await getArray(store), []);

        store.set("foo", Promise.resolve("FOO"));
        assert.equal(await store.get("foo"), "FOO");
        assert.deepEqual(await getArray(store), ["FOO"]);

        assert.equal(await store.get("bar"), undefined);

        store.set("buz", Promise.resolve("BUZ-1"));
        store.set("buz", Promise.resolve("BUZ-2"));
        assert.equal(await store.get("buz"), "BUZ-2");
        assert.deepEqual(await getArray(store), ["FOO", "BUZ-2"]);
    });

    it("shrink()", async () => {
        const store = new LinkedStorage<Promise<number>>();

        store.set("1", Promise.resolve(1));
        store.set("2", Promise.resolve(2));
        store.set("3", Promise.resolve(3));
        store.set("4", Promise.resolve(4));
        store.set("5", Promise.resolve(5));

        assert.equal(await store.get("1"), 1);
        assert.equal(await store.get("2"), 2);
        assert.equal(await store.get("3"), 3);
        assert.equal(await store.get("4"), 4);
        assert.equal(await store.get("5"), 5);
        assert.deepEqual(await getArray(store), [1, 2, 3, 4, 5]);

        store.shrink(3);

        assert.equal(await store.get("1"), undefined);
        assert.equal(await store.get("2"), undefined);
        assert.equal(await store.get("3"), 3);
        assert.equal(await store.get("4"), 4);
        assert.equal(await store.get("5"), 5);
        assert.deepEqual(await getArray(store), [3, 4, 5]);
    });

    it("delete()", async () => {
        const store = new LinkedStorage<Promise<number>>();

        store.set("1", Promise.resolve(1));
        store.set("2", Promise.resolve(2));
        store.set("3", Promise.resolve(3));
        store.set("4", Promise.resolve(4));
        store.set("5", Promise.resolve(5));

        assert.deepEqual(await getArray(store), [1, 2, 3, 4, 5]);

        store.delete("1");
        assert.equal(await store.get("1"), undefined);
        assert.deepEqual(await getArray(store), [2, 3, 4, 5]);

        store.delete("5");
        assert.equal(await store.get("5"), undefined);
        assert.deepEqual(await getArray(store), [2, 3, 4]);

        store.delete("3");
        assert.equal(await store.get("3"), undefined);
        assert.deepEqual(await getArray(store), [2, 4]);

        store.delete("2");
        assert.equal(await store.get("2"), undefined);
        assert.deepEqual(await getArray(store), [4]);

        store.delete("4");
        assert.equal(await store.get("4"), undefined);
        assert.deepEqual(await getArray(store), []);
    });
});

async function getArray<T = any>(store: LinkedStorage<any>): Promise<T[]> {
    return Promise.all(store.values().map(item => item.value));
}