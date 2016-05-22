.PHONY: test

test:
	@node test/run.js
	@git diff --exit-code -- app/test/**/test-*.js gitmem/test/**/test-*.js
