#!/bin/bash
set -e
set -u

git submodule init
git submodule update

rm -rf ./public/
hugo

npm ci
rm -rf ./themes/eon/node_modules
mv ./node_modules ./themes/eon/node_modules

./themes/eon/scripts/dist-prettier
./themes/eon/scripts/dist-remove-empty-lines
# Depends on https://github.com/ryanburnette/eon/pull/8
#./themes/eon/scripts/dist-hash
