# Spacetime

Spacetime is a programming environment for interactive 2D graphics with a different approach to time. Programs are a grid of cells with time as the `x` dimension. See [spacetime.me](https://www.spacetime.me) for an introduction and demo.

## Try it out

* On the web: Go to [spacetime.me/b3/new](https://www.spacetime.me/b3/new) to try Spacetime. The usage is on the [home page](https://www.spacetime.me) (demo and text).
* Locally:

``` bash
$ git clone https://github.com/getspacetime/spacetime.git
$ cd spacetime
$ open new.html
```

## Development

Spacetime is extremely early stage software. It's currently in the "research" phase, which means that the goal is to explore ideas and not to make a polished product. Essential functionality will be missing, and I may throw all the code away and start over (as I've done twice already).

If you are interested in Spacetime, there's a [Google group](https://groups.google.com/forum/#!forum/spacetime-talk) where we'll discuss the direction of the project, upcoming releases, and any other feedback you have. If you'd like to contribute, introduce yourself there or email me at [jake@jakesandlund.com](mailto:%6a%61%6b%65@%6a%61%6b%65%73%61%6e%64%6c%75%6e%64.%63%6f%6d).

### Running local git server

Install nginx and fcgiwrap
``` bash
$ brew install nginx
$ brew install fcgiwrap
$ cp dev/nginx.example.conf dev/nginx.conf
```

Edit the `dev/nginx.conf` for paths to `spacetime` and optionally fill in the client secret. Start nginx and fcgiwrap:

``` bash
$ rm dev/fcgiwrap.sock  # if it exists already
$ /usr/local/sbin/fcgiwrap -s unix:./dev/fcgiwrap.sock
$ nginx -c /Users/jakesandlund/spacetime/dev/nginx.conf
```

Add a bare repository to `dev/local-git` and test pushing to it:

``` bash
$ cd dev/local-git
$ git init --bare testrepo.git
$ cd testrepo.git
$ git config http.receivepack true  # allow unauthenticated pushes
$ cd ~/path/to/testrepo
$ git push http://localhost:8080/local-git/testrepo.git master
```

### Testing

Testing is done by logging values with `log`. The values are written to the test file below the log line (in addition to the terminal). Any changes to the logged values will create a diff. This means logged values must be deterministic. An example (from [test-blob.js](https://github.com/getspacetime/spacetime/blob/master/test/gitmem/test-blob.js)):

``` js
var blobRange = Blob.create('foo', []);
log(pretty($h, blobRange[0], blobRange[1]));
//=> blob 3\x00foo
```

All lines starting with `//=> ` are added automatically when the file runs (e.g. `node test-blob.js`). To run all tests, use `make`. Broken tests will result in a `git diff`. If the changed output is desired, simply `git add` the diff.

This testing by logging method is new to me, but so far I like it. The test files are not as clean as they could be with a more structured testing framework, but the advantage is that making automated tests is easy and similar to printf debugging (or manual testing via printing).

If you are using Vim, the following adds a keyboard shortcut (`<leader>r`) to run the test file and reload any changed logs lines.

``` vim
nnoremap <leader>r :w<CR>:Test<CR>:e<CR>
command -nargs=0 Test execute 'silent !dev/run-test-for-vim.sh %' | redraw!
```

## License and Copyright

The license is available at [LICENSE.txt](https://github.com/getspacetime/spacetime/blob/master/LICENSE.txt). Licenses for libraries used in this project are available in the [docs/LICENSES directory](https://github.com/getspacetime/spacetime/tree/master/docs/LICENSES).

Copyright &copy; 2015  Jacob Sandlund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
