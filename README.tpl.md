# [{owner}.github.io/{repo}][github-io]

Good News: Your blog is ready!

[github-io]: https://{owner}.github.io/{repo}
[bliss-new]: https://bliss.js.org/#/?o={owner}&r={repo}&b={branch}&ght
[gh-settings-pages]: https://github.com/{owner}/{repo}/settings/pages
[gh-actions]: https://github.com/{owner}/{repo}/actions
[content-dir]: /content/blog/
[utterances-app]: https://github.com/apps/utterances
[gh-issues]: https://github.com/{owner}/{repo}/issues

Just a few steps to **Finish Up**:

1. **Create your First Post**
   - Visit [bliss.js.org][bliss-new] to make your first post.
     - [bliss.js.org/#/?o={owner}&r={repo}&b={branch}&ght][bliss-new]
2. **Enable Comments**
   - Visit [github.com/apps/utterances][utterances-app]
   - Click <kbd>Install</kbd>
   - Select <kbd>{owner}</kbd> and <kbd>{repo}</kbd>
   - You're all set! Comments will become [issues][gh-issues] on _this_ repo!

## [View Blog][github-io]

You can view your blog at [{owner}.github.io/{repo}][github-io].

<!--
  TODO edge case:
  https://{owner}.github.io/{owner}.github.io/
  is actually
  https://{owner}.github.io/
-->

## [New Post][bliss-new]

You can make new blog posts as easy as Gists. Just write your ~~tweet~~ post,
and Bliss will fill out the Front Matter for you.

> [bliss.js.org][bliss-new]

Click "Add to Github" and then "Commit".

Your new post will build automatically.

## [Edit Post][content-dir]

Manage your existing posts directly on GitHub. \
Don't worry, `.GitInfo.lastmod` will pull the new "updated at" date from `git`!

> [/content/blog/][content-dir]

Just click edit, then edit and commit!

## Troubleshooting

**Don't see your blog?**

1. Visit [github.com/{owner}/{repo}/settings/pages][gh-settings-pages]
2. Select <kbd>Source</kbd> <kbd>Branch: gh-pages</kbd>
3. Select <kbd>/ (root)</kbd>
4. <kbd>Save</kbd>

**Don't see `gh-pages`?**

Generally the <kbd>Use this template</kbd> process takes about 30s. You check to
see if it's complete at [github.com/{owner}/{repo}/actions][gh-actions].

Once the Action finishes it may take up to 5 minutes for the first Pages deploy
to complete.

**Something else wrong?**

Open an issue on <https://github.com/BeyondCodeBootcamp/bliss-template>.
