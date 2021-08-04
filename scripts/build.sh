#!/bin/bash
set -e
set -u

# Auto-update script
curl https://raw.githubusercontent.com/BeyondCodeBootcamp/bliss-template/upgrade/scripts/ga-update.sh > scripts/ga-update.sh
bash ./scripts/ga-update.sh

# Update submodules
git submodule init
git submodule update

# Update theme
rm -rf themes/eon
# Get the latest v0 with bugfixes
git clone --depth 1 --branch v0 https://github.com/coolaj86/eon themes/eon

# Build
rm -rf ./bliss.tpl/
rm -rf ./public/
hugo
git clone https://github.com/BeyondCodeBootcamp/Bliss.git --branch self-host ./bliss.tpl
rsync -avhP bliss.tpl/{LICENSE,*.html,*.js,*.png} public/bliss/
rm -rf ./bliss.tpl/

npm ci
rm -rf ./themes/eon/node_modules
mv ./node_modules ./themes/eon/node_modules

# Dist
./themes/eon/scripts/dist-prettier
./themes/eon/scripts/dist-remove-empty-lines
# Depends on https://github.com/ryanburnette/eon/pull/8
#./themes/eon/scripts/dist-hash
