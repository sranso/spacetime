# GitMem(ory)


## Development

### Running local git server

Install nginx and fcgiwrap
```
$ brew install nginx
$ brew install fcgiwrap
$ cp nginx.example.conf nginx.conf
```

Edit the `nginx.conf` for paths to `gitmem` and client secret. Start nginx and fcgiwrap:

```
$ /usr/local/sbin/fcgiwrap -s unix:./fcgiwrap.sock
$ nginx -c /Users/jakesandlund/dev/gitmem/nginx.conf
```
