#!/usr/bin/env bash -c make

ALL=\
	dist/async-cache-queue.mjs \
	dist/async-cache-queue.min.js \
	build/test.js \

all: $(ALL)

# ES5 minified
dist/async-cache-queue.min.js: build/async-cache-queue.cjs
	./node_modules/.bin/terser --ecma 5 -c -m -o $@ $<
	ls -l $@

# minified IIFE to ES Module
build/timed-kvs.js: node_modules/timed-kvs/dist/timed-kvs.min.js
	perl -pe 's#^var #let exports; export const #' < $^ > $@

# ES5 (but ES Module!!)
build/es5/%.js: lib/%.ts build/timed-kvs.js
	./node_modules/.bin/tsc -p tsconfig-es5.json
	perl -i -pe 's#from "timed-kvs"#from "../timed-kvs"#' build/es5/data-storage.js

# ES5 IIFE
build/%.cjs: build/es5/%.js
	./node_modules/.bin/rollup -f "iife" -n "ACQ" -o $@ $<
	perl -i -pe 's#^\}\)\(\{\}\);#})("undefined" !== typeof exports ? exports : {});#' $@

# ES Module
dist/%.mjs: build/esm/%.js
	./node_modules/.bin/rollup -f "es" -o $@ $<

# ES Module
build/esm/%.js: lib/%.ts
	./node_modules/.bin/tsc -p tsconfig-esm.json

# ES6 CommonJS
build/test.js: test/*.js dist/async-cache-queue.min.js
	./node_modules/.bin/browserify test/*.js \
		-t [ browserify-sed 's#require\("../(lib/async-cache-queue)?"#require("../browser/import"#' ] --list | grep -v /node_modules/
	./node_modules/.bin/browserify -o $@ test/*.js \
		-t [ browserify-sed 's#require\("../(lib/async-cache-queue)?"#require("../browser/import"#' ]

# ES6 CommonJS
test/%.js: test/%.ts
	./node_modules/.bin/tsc -p tsconfig.json

clean:
	/bin/rm -fr $(ALL) build/

test:
	./node_modules/.bin/mocha test/*.js
	node -e 'import("./dist/async-cache-queue.mjs").then(x => x.clearCache())'
	node -e 'require("./dist/async-cache-queue.min.js").clearCache()'

test-browser: build/test.js
	open ./browser/test.html

.PHONY: all clean test test-browser
