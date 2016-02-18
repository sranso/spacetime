.PHONY: test build

all: build test

build:
	@node ./src/gitmem/sha1-preprocessor.js

test:
	@./test/run.sh
