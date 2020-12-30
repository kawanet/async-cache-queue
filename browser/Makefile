#!/usr/bin/env bash -c make

all: ../dist/async-cache-queue.min.js ../build/test.js

../dist/async-cache-queue.min.js: ../build/async-cache-queue.bundle.js
	../node_modules/.bin/terser -c -m -o $@ $<

../build/async-cache-queue.bundle.js: ../build/lib/async-cache-queue.js
	../node_modules/.bin/browserify -o $@ -s ACQ $<
	perl -i -pe 's#^("use strict"|Object.defineProperty|exports.*= void 0)#// $$&#' $@

../build/lib/async-cache-queue.js: ../lib/async-cache-queue.ts
	../node_modules/.bin/tsc -p .

../build/test.js: ../build/lib/async-cache-queue.js
	../node_modules/.bin/browserify -o $@ ../test/[1-7][0-9].*.js

clean:
	/bin/rm -fr ../build/ *.js

.PHONY: all clean test
