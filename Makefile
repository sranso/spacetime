.PHONY: test

test:
	@node test/run.js
	@git diff --exit-code -- */test-*.js
