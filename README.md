# Spacetime

Spacetime is a programming environment for interactive 2D graphics with a different approach to time. Programs are a grid of cells with time as the `x` dimension. See [spacetime.me](https://www.spacetime.me) for an introduction and demo.

## Try it out

* On the web: Go to [spacetime.me/b13/new](https://www.spacetime.me/b13/new) to try Spacetime. The usage is on the [home page](https://www.spacetime.me) (demo and text).
* Locally:

``` bash
$ git clone https://github.com/spacetimecode/spacetime.git
$ cd spacetime
$ open new.html
```

## Development

Spacetime is extremely early stage software. It's currently in the "research" phase, which means that the goal is to explore ideas and not to make a polished product. Essential functionality will be missing, and I may throw all the code away and start over (as I've done twice already).

If you are interested in Spacetime, there's a [Google group](https://groups.google.com/forum/#!forum/spacetime-talk) where we'll discuss the direction of the project, upcoming releases, and any other feedback you have. If you're interested in contributing, let me know there.

### Running local git server

Install nginx and fcgiwrap
```
$ brew install nginx
$ brew install fcgiwrap
$ cp dev/nginx.example.conf dev/nginx.conf
```

Edit the `dev/nginx.conf` for paths to `spacetime` and optionally fill in the client secret. Start nginx and fcgiwrap:

```
$ /usr/local/sbin/fcgiwrap -s unix:./dev/fcgiwrap.sock
$ nginx -c /Users/jakesandlund/spacetimecode/spacetime/dev/nginx.conf
```

## License and Copyright

The license is available at [LICENSE.txt](https://github.com/spacetimecode/spacetime/blob/master/LICENSE.txt). Licenses for libraries used in this project are available in the [LICENSES directory](https://github.com/spacetimecode/spacetime/tree/master/LICENSES).

Copyright &copy; 2015  Jacob Sandlund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
