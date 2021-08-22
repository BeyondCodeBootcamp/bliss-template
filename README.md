# Bliss Template

[bliss]: https://bliss.js.org
[eon-screenshot]:
  https://user-images.githubusercontent.com/2252601/128049346-f187bb73-8d05-47e5-8ef6-283d8517190a.png

Want a blog like this? In about... 30 seconds from now?

[![eon][eon-screenshot]](https://ryanburnette.com)

### Features

- [x] 0 Configuration (`config.yaml` builds itself)
- [x] [0 Dependency on GitHub](/README.tpl.md#manual-builds) (just happens to work in push-button fashion here) 
- [x] Web interface (Bliss) and CLI tools (Hugo)
- [x] Build at Home (localhost) or Abroad (GitHub Actions)
- [x] Built-in Edit links

## Make it Yours

1. GitHub Templates:
   <kbd><a href="https://github.com/BeyondCodeBootcamp/bliss-template/generate">Use
   this template</a></kbd>
2. Pick a name - probably `blog` (or something else real nice and simple like)
   - (it will deploy to `https://<owner>.github.io/<repo>`)
3. **Wait 30 seconds**, and your blog will be ready.
   - See **next steps** in the new README.md!

## Has it been 30 seconds?

Are you seeing this default README after created a new repo from our template?

**Refresh the page** ♻️.

You can also check your <kbd>Actions</kbd> tab. If the automatic configuration
failed
[open an issue](https://github.com/BeyondCodeBootcamp/bliss-template/issues) and
I'll see if I can help.

## What's Next?

A new `README.md` with additional instructions will appear in your new repo
about **30s after** you click
<kbd><a href="https://github.com/BeyondCodeBootcamp/bliss-template/generate">Use
this template</a></kbd>.

It will contain **direct links** into your GitHub Pages Settings to click a few
buttons. No muss, no fuss (and no searching for the right page).

Basically, you'll do this:

- [ ] Enable GitHub Pages for your default branch
  - <kbd>Settings</kbd> ➡️ <kbd>Pages</kbd> (left-hand side) ➡️ <kbd>Branch:
    gh-pages</kbd>
- [ ] Enable GitHub Issues as comments via [utterences](https://utterenc.es)
- [ ] Create your first post using [bliss.js.org][bliss] as a front-end
  - The **New Post** link in the `README` will be pre-filled with your blog's
    repo.

Your site will be available at <kbd>https://{owner}.github.io/{repo}/</kbd>.

### Custom Domains

If you'd like to use a custom domain, such as `example.com`:

1. Create a file `CNAME` in the root of the project \
   (the obvious, normal, top-level directory)
3. Login to your Domain / DNS provider (such as [name.com](https://name.com)) and replace any `example.com` records with 
  - EITHER an `ANAME` (also called `ALIAS`) record
    - the `ANAME` record should point to
      ```txt
      <user-or-organization>.github.io
      ```
  - OR `A` and `AAAA` records
    - `A` records should point to
      ```txt
      185.199.108.153
      185.199.109.153
      185.199.110.153
      185.199.111.153
      ```
    - `AAAA` records should point to
      ```txt
      2606:50c0:8000::153
      2606:50c0:8001::153
      2606:50c0:8002::153
      2606:50c0:8003::153
      ```

For more info, see <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain>

## Other Sites using the eon theme:

- [ryanburnette.com](https://ryanburnette.com)
- [therootcompany.com](https://therootcompany.com)
