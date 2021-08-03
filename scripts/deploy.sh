#!/bin/bash
set -u
set -e

# save the current branch
my_branch="$(git rev-parse --abbrev-ref HEAD)"

# set "Pages" branch
PAGES_BRANCH="${PAGES_BRANCH:-gh-pages}"

# Checkout or create (new orphan) Pages branch
if git show-ref --verify --quiet refs/heads/"${PAGES_BRANCH}"; then
    git checkout -f "${PAGES_BRANCH}"
else
    git checkout --orphan "${PAGES_BRANCH}"
    rm .git/index
    git clean -fdx --exclude=public
fi

# Copy and commit freshly built site
rsync -avhP public/ ./
rm -rf public/
rm -rf themes/
git add ./
git commit -m "deploy: latest build"

# Push to GitHub Pages with default GITHUB_TOKEN
if [[ -n ${GITHUB_REPOSITORY:-} ]]; then
    # See https://github.community/t/github-action-not-triggering-gh-pages-upon-push/16096/4
    my_git_base="${GITHUB_SERVER_URL:8}" # strip 'https://'
    my_git_remote="https://${GH_BASIC_AUTH}@${my_git_base}/${GITHUB_REPOSITORY}.git"
    git remote add pages "${my_git_remote}"
    git push pages gh-pages -f
else
    git push -u origin gh-pages -f
fi

# restore original branch
git checkout "${GITHUB_REF:-$my_branch}"
