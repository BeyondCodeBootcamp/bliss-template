```bash
hugo new site mysite
cd mysite
git init
git submodule add https://github.com/ryanburnette/eon themes/eon

npm install
pushd ./themes/eon/
  npm ci
popd
./themes/eon/scripts/development
```

TODO make it clear that it's listening and that TWO things are running (webpack dev and hugo dev).

http://localhost:3000/

TODO .ignore - source maps, minified, etc

noindex: false

```bash
./themes/eon/scripts/assets-build
./themes/eon/scripts/hugo
./themes/eon/scripts/dist-purgecss
./themes/eon/scripts/dist-prettier
./themes/eon/scripts/dist-remove-empty-lines
./themes/eon/scripts/dist-hash
```

Update eon:

```bash
pushd themes/eon
  git checkout master
  git pull
popd
git add themes/eon
git commit -m "update eon submodule"
git submodule init
git submodule update
```
