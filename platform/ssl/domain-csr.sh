#!/bin/bash
openssl req -new -sha256 -key ../secret/domain.key -subj "/" -reqexts SAN -config <(cat /etc/pki/tls/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:www.spacetime.me,DNS:spacetime.me")) > domain.csr
