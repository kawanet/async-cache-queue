#!/usr/bin/env bash -c make

all: dist ../build/test.js

# dist/*.min.js uses ES5
../dist/async-cache-queue.min.js: ../build/async-cache-queue.bundle.js
	../node_modules/.bin/terser -c -m -o $@ $<
	ls -l $@

../build/async-cache-queue.bundle.js: ../build/lib/async-cache-queue.js
	../node_modules/.bin/browserify --list $<
	../node_modules/.bin/browserify -o $@ -s ACQ $<
	perl -i -pe 's#^("use strict"|Object.defineProperty|exports.*= void 0)#// $$&#' $@

# build/lib/*.js uses ES5
../build/lib/async-cache-queue.js: ../lib/async-cache-queue.ts
	../node_modules/.bin/tsc -p .

# build/test/*.js uses ES6
../build/test.js: ../dist/async-cache-queue.min.js
	../node_modules/.bin/tsc -p ..
	mkdir -p ../build/test
	cp -p ../test/[1-7][0-9].*.js ../build/test
	perl -i -pe 's#require\("../(lib/async-cache-queue)?"#require("../../browser/import"#' ../build/test/*.js
	../node_modules/.bin/browserify -o $@ ../build/test/*.js

dist: ../dist/async-cache-queue.min.js

clean:
	/bin/rm -fr ../build/ ../dist/*.js

test: ../build/test.js
	open ../browser/test.html

.PHONY: all clean test
