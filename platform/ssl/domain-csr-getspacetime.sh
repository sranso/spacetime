#!/bin/bash
openssl req -new -sha256 -key ../secret/domain-getspacetime.key -subj "/" -reqexts SAN -config <(cat /etc/pki/tls/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:www.getspacetime.com,DNS:getspacetime.com")) > domain-getspacetime.csr
