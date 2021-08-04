#!/bin/bash
set -e
set -u

if echo "${GITHUB_REPOSITORY:-}" | grep -- '-template' > /dev/null; then
    echo "skip: don't replace the template on a template repository"
    exit 0
fi

if ! grep '<owner>\|<repo>' config.yaml > /dev/null; then
    echo "skip: config.yaml appears up-to-date"
    exit 0
fi

GH_TOKEN="${GH_TOKEN:-}"

# For local demo
# Ex: GITHUB_REPOSITORY=coolaj86/blog
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-$(whoami)/$(basename "$(pwd)")}"
GITHUB_REF="${GITHUB_REF:-refs/heads/main}"

# slashes cannot exist in a valid owner name
GH_OWNER="$(echo "${GITHUB_REPOSITORY}" | cut -d'/' -f1)"
# slashes also cannot exist in a valid repo name
GIT_REPO="$(echo "${GITHUB_REPOSITORY}" | cut -d'/' -f2)"

# slashes _can_ exist in a valid branch name,
# but refs are enumerated <heads|tags|remotes>
GIT_REF="$(echo "${GITHUB_REF}" | cut -d'/' -f3-)"

# TODO is it at all possible for a verified user to not have a public profile?
#my_type="user"
my_profile=""
my_basic_auth=""
if [[ -n ${GH_TOKEN:-} ]]; then
    # this works assuming no spaces in username or token
    my_basic_auth="--user ${GH_OWNER}:${GH_TOKEN:-}"
fi

# "Resource not accessible by integration" (can't use GA tokens)
#curl -s ${my_basic_auth} "https://api.github.com/user" \
#    -H "Accept: application/vnd.github.v3+json"

if [[ -n ${my_basic_auth} ]]; then
    my_profile="$(
        curl -s ${my_basic_auth} https://api.github.com/users/"${GH_OWNER}" \
            -H "Accept: application/vnd.github.v3+json"
    )"
else
    my_profile="$(
        curl -s "https://api.github.com/users/${GH_OWNER}" \
            -H "Accept: application/vnd.github.v3+json"
    )"
fi

if [[ -z ${my_profile} ]]; then
    #my_type="owner"
    my_profile="$(
        curl -s ${my_basic_auth} "https://api.github.com/orgs/${GH_OWNER}" \
            -H "Accept: application/vnd.github.v3+json"
    )"
fi

my_name=""
my_email=""
if [[ -n ${my_profile} ]]; then
    my_name="$(echo "${my_profile}" | jq -r ".name")"
    my_email="$(echo "${my_profile}" | jq -r '.email')"
    if [[ "null" == "${my_email}" ]]; then
        my_email=""
    fi
fi

if [[ -z ${my_email} ]]; then
    my_email="$(
        curl -s ${my_basic_auth} "https://api.github.com/users/${GH_OWNER}/events/public" \
            -H "Accept: application/vnd.github.v3+json" |
            grep '"email":' | sort | uniq -c | sort -nr | head -1 | cut -d'"' -f4
    )"
fi

echo "GH_OWNER=${GH_OWNER}"
echo "GIT_REPO=${GIT_REPO}"
echo "GIT_REF=${GIT_REF}"
echo "my_name=${my_name}"
echo "my_email=${my_email}"

sd -s '<owner>' "${GH_OWNER}" config.yaml
sd -s '<repo>' "${GIT_REPO}" config.yaml
sd -s '<branch>' "${GIT_REF}" config.yaml
sd -s '<name>' "${my_name}" config.yaml
sd -s '<email>' "${my_email}" config.yaml

sd -s '{owner}' "${GH_OWNER}" README.tpl.md
sd -s '{repo}' "${GIT_REPO}" README.tpl.md
sd -s '{branch}' "${GIT_REF}" README.tpl.md
sd -s '{name}' "${my_name}" README.tpl.md
sd -s '{email}' "${my_email}" README.tpl.md

if [[ -n ${my_basic_auth} ]]; then
    git add config.yaml

    git add README.tpl.md
    git rm -rf README.md || true
    git mv README.tpl.md README.md

    git commit -m "deploy: complete config.yaml and README.md from GitHub profile"
    git push origin "${GIT_REF}"
fi
