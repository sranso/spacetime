#!/bin/bash
openssl req -new -sha256 -key ../secret/domain-spacetime-me.key -subj "/" -reqexts SAN -config <(cat /etc/pki/tls/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:www.spacetime.me,DNS:spacetime.me")) > domain-spacetime-me.csr
