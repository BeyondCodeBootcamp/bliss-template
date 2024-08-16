var Post = {};
var PostModel = {};

var Blog = {};
var BlogModel = {};

function _localStorageGetIds(prefix, suffix) {
  var i;
  var key;
  var ids = [];
  for (i = 0; i < localStorage.length; i += 1) {
    key = localStorage.key(i);
    if (prefix && !key.startsWith(prefix)) {
      continue;
    }
    if (suffix && !key.endsWith(suffix)) {
      continue;
    }
    ids.push(key.slice(prefix.length).slice(0, -1 * suffix.length));
  }
  return ids;
}

function _localStorageGetAll(prefix) {
  var i;
  var key;
  var items = [];
  for (i = 0; i < localStorage.length; i += 1) {
    key = localStorage.key(i);
    if (!key.startsWith(prefix)) {
      continue;
    }
    items.push(JSON.parse(localStorage.getItem(key)));
  }
  return items;
}

(async function () {
  "use strict";

  // Poor man's dependency tree
  // (just so everybody knows what I expect to use in here)
  var XTZ = window.XTZ;
  var $ = window.$;
  var $$ = window.$$;
  var localStorage = window.localStorage;

  Blog.serialize = function (ev) {
    ev.stopPropagation();
    ev.preventDefault();

    var $form = ev.target.closest("form");
    var repo = $('input[name="repo"]', $form).value;
    var gitbranch = $('input[name="gitbranch"]', $form).value;
    var githost = $('select[name="githost"]', $form).value;
    var blog = $('select[name="blog"]', $form).value;

    var dirty = false;
    try {
      new URL(repo);
    } catch (e) {
      // ignore
      // dirty, don't save
      dirty = true;
    }

    if (dirty || !gitbranch) {
      Post.serialize(ev);
      return;
    }

    var parts = BlogModel._splitRepoBranch(repo, gitbranch);
    // TODO doesn't quite feel right
    $('input[name="gitbranch"]', $form).value = parts.gitbranch;
    if (repo.toLowerCase().startsWith("https://github.com/")) {
      githost = "github";
      $('select[name="githost"]', $form).value = githost;
    }
    $('input[name="repo"]', $form).value = parts.repo;

    BlogModel.save({
      repo: parts.repo,
      gitbranch: parts.gitbranch,
      githost: githost,
      blog: blog, // system (ex: Hugo)
    });
    Blog._renderRepoTypeaheads();
    Post.serialize(ev);
  };

  Blog._renderRepoTypeaheads = function () {
    $("#-repos").innerHTML = BlogModel.all().map(function (blog) {
      var id = blog.repo;
      if (blog.gitbranch) {
        id += "#" + blog.gitbranch;
      }
      return Blog._typeaheadTmpl.replace(/{{\s*id\s*}}/, id);
    });
  };

  /**
   *
   * Post is the View
   *
   */
  Post.create = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    Post._deserialize(PostModel.create().uuid);
    Post._renderRows();
  };

  Post.serialize = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    Post._update(PostModel._current);
  };
  Post._serialize = function (post) {
    // TODO debounce with max time
    var timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    post.timezone = post.timezone || timezone;

    // TODO refactor
    post._gitbranch = $('input[name="gitbranch"]').value || "main";
    post._repo = ($('input[name="repo"]').value || "").replace(/\/+$/, "");
    post.blog_id = post._repo + "#" + post._gitbranch;
    //post.title = $('input[name="title"]').value;
    // 2021-07-01T13:59:59 => 2021-07-01T13:59:59-0600
    /*
    post.created = XTZ.toUTC(
      $('input[name="created"]').value,
      timezone
    ).toISOString();
    */
    post.updated = post.updated || post.created;

    var text = $('textarea[name="content"]').value;
    post.title = PostModel._parseTitle(text);

    // skip the first line of text (which was the title)
    post.content = text
      .split(/[\r\n]/g)
      .slice(1)
      .join("\n")
      .trim();

    var inputDescription = $('textarea[name="description"]').value;
    if (inputDescription && post.description) {
      if (!post._dirtyDescription) {
        post._dirtyDescription = post.description !== inputDescription;
      }
    } else {
      post._dirtyDescription = false;
    }
    if (!post._dirtyDescription) {
      post.description = PostModel._parseDescription(post);
    } else {
      post.description = inputDescription;
    }

    PostModel.save(post);
  };

  Post.patch = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    // Example:
    // If the description is empty, let the user have a chance
    // to fill in the blank (despite the fact that we set the
    // default value and just skip showing it)
    if (!ev.target.value) {
      PostModel._current[ev.target.name] = "";
      Post._serialize(PostModel._current);
      return;
    }

    Post._update(PostModel._current);
  };
  Post._update = function (post) {
    Post._serialize(post);
    if (post._previous.title !== post.title) {
      var cell = $('input[name="uuid"][value="' + post.uuid + '"]');
      var row = cell.closest("tr");
      row.outerHTML = Post._renderRow(post.uuid);
      post._previous.title = post.title;
    }
    Post._rawPreview(post);
  };

  // From DB to form inputs
  Post.deserialize = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    var parent = ev.target.closest(".js-row");
    var uuid = $('input[name="uuid"]', parent).value;
    localStorage.setItem("current", uuid);
    // TODO maybe current should have a more precise name, such as currentPost
    PostModel._current = Post._deserialize(uuid);
  };
  Post._deserialize = function (uuid) {
    var post = PostModel.getOrCreate(uuid);
    var blog = BlogModel.getByPost(post) || {
      // deprecate
      repo: post._repo,
      githost: post._githost,
      gitbranch: post._gitbranch,
      blog: post._blog,
    };
    if (blog.githost) {
      $('select[name="githost"]').value = blog.githost;
    }
    if (blog.gitbranch) {
      $('input[name="gitbranch"]').value = blog.gitbranch;
    }
    if (blog.blog) {
      $('select[name="blog"]').value = blog.blog;
    }
    $('input[name="repo"]').value = blog.repo;

    //$('input[name="title"]').value = post.title;
    //$('input[name="created"]').value = PostModel._toInputDatetimeLocal(post.created);
    if (post.title || post.content) {
      $('textarea[name="content"]').value =
        "# " + (post.title || "Untitled") + "\n\n" + post.content;
    } else {
      $('textarea[name="content"]').value = "";
    }
    $('textarea[name="description"]').value = post.description || "";
    $(".js-undelete").hidden = true;

    Post._rawPreview(post);
    return post;
  };

  Post._renderRows = function () {
    var uuids = PostModel.ids();
    if (!uuids.length) {
      // Create first post ever on first ever page load
      // (or after literally everything is deleted)
      Post._deserialize(PostModel.create().uuid);
      uuids = PostModel.ids();
    }

    var items = uuids.map(Post._renderRow);
    if (!items.length) {
      items.push(
        Post._rowTmpl
          .replace(/ hidden/g, "")
          .replace("{{title}}", "<i>Untitled</i>")
          .replace("{{uuid}}", "")
          .replace(
            "{{created}}",
            "🗓" +
              PostModel._toInputDatetimeLocal(new Date()).replace(/T/g, " ⏰")
          )
          .replace(
            "{{updated}}",
            "🗓" +
              PostModel._toInputDatetimeLocal(new Date()).replace(/T/g, " ⏰")
          )
      );
    }
    $(".js-items").innerHTML = items.join("\n");
  };

  Post._renderRow = function (uuid) {
    var post = PostModel.getOrCreate(uuid);
    var tmpl = Post._rowTmpl
      .replace(/ hidden/g, "")
      .replace(
        "{{title}}",
        post.title.slice(0, 50).replace(/</g, "&lt;") || "<i>Untitled</i>"
      )
      .replace("{{uuid}}", post.uuid)
      .replace(
        "{{created}}",
        "🗓" +
          PostModel._toInputDatetimeLocal(post.created).replace(/T/g, "<br>⏰")
      )
      .replace(
        "{{updated}}",
        "🗓" +
          PostModel._toInputDatetimeLocal(post.updated).replace(/T/g, "<br>⏰")
      );
    return tmpl;
  };

  Post.delete = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    var q = "Are you sure you want to permanently delete this draft?";

    var parent = ev.target.closest(".js-row");
    var uuid = $('input[name="uuid"]', parent).value;

    if (!window.confirm(q)) {
      return;
    }

    if (!$(".js-undelete").hidden) {
      // if we're deleting multiple things, we don't want to re-save on delete
      Post.serialize(ev);
    }
    PostModel.delete(uuid);
    if (uuid === PostModel._current.uuid) {
      // load as a failsafe, just in case
      localStorage.removeItem("current", uuid);
      localStorage.setItem("current", PostModel.ids()[0]);
    } else {
      PostModel._current = Post._deserialize(uuid);
    }

    Post._renderRows();
    $(".js-undelete").hidden = false;
  };

  Post.undelete = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();

    Post._update(PostModel._current);
    $(".js-undelete").hidden = true;
    Post._renderRows();
  };

  Post._rawPreview = function (post) {
    post = Post._gitNewFilePreview(post);
    post = Post._liveFormPreview(post);
  };
  // TODO PostModel
  Post._systems = {
    /*
     * Example:
      ---
      description: "Change ME to a good search engine-friendly description"
      ogimage: 'https://...'
      player: 'https://www.youtube.com/embed/XXXXXXXX?rel=0'
      youtube: XXXXXXXX
      categories:
        - Videography
      permalink: /articles/CHANGE-ME-SLUG/
      ---
     */
    desi: {
      pathname: "/posts",
      frontmatter: [
        "---",
        'title: "{{title}}"',
        'description: "{{description}}"',
        'timezone: "{{timezone}}"',
        'date: "{{created}}"',
        'updated: "{{updated}}"',
        "uuid: {{uuid}}",
        "categories:",
        "  - Web Development",
        "permalink: /articles/{{slug}}/",
        "---",
      ],
    },
    hugo: {
      pathname: "/content/blog",
      frontmatter: [
        "---",
        'title: "{{title}}"',
        'description: "{{description}}"',
        'timezone: "{{timezone}}"',
        'date: "{{created}}"',
        'lastmod: "{{updated}}"',
        "uuid: {{uuid}}",
        "categories:",
        "  - Web Development",
        "---",
      ],
    },
    bash: {
      pathname: "/articles",
      frontmatter: [
        // BashBlog has no frontmatter
        "{{title}}",
        '<meta name="description" content="{{description}}" />',
      ],
    },
    zola: {
      pathname: "/content",
      // RFC3339
      date: "iso",
      frontmatter: [
        // Zola uses TOML frontmatter
        "+++",
        "title = {{title}}",
        "description = {{description}}",
        "date = {{created}}",
        "updated = {{updated}}",
        "draft = false",
        "slug = {{slug}}",
        "+++",
      ],
    },
  };
  // TODO auto-upgrade the oldies
  Post._systems.eon = Post._systems.hugo;
  Post._gitNewFilePreview = function (post) {
    var blog = BlogModel.getByPost(post) || {
      // deprecate
      repo: post._repo,
      githost: post._githost,
      gitbranch: post._gitbranch,
      blog: post._blog,
    };
    post.slug = PostModel._toSlug(post.title);
    post._filename = post.slug + ".md";
    post._template = (
      Post._systems[blog.blog] || Post._systems.hugo
    ).frontmatter.join("\n");

    // TODO Post._renderFrontmatter
    var created = Post._formatFrontmatter(
      "created",
      post.created,
      post._system
    );
    var updated = Post._formatFrontmatter(
      "updated",
      post.updated,
      post._system
    );
    post._frontMatter = post._template
      // TODO loop to make look nicer?
      // ['title', 'timezone', 'created', 'updated', ... ]
      // str = str.replace(new RegExp('{{'+key+'}}', 'g'), val)
      // str = str.replace(new RegExp('"{{'+key+'}}"', 'g'), val)
      .replace(/"{{title}}"/g, JSON.stringify(post.title))
      .replace(/{{title}}/g, post.title)
      .replace(/"{{description}}"/g, JSON.stringify(post.title))
      .replace(/{{description}}/g, post.title)
      .replace(/"{{timezone}}"/g, JSON.stringify(post.timezone))
      .replace(/{{timezone}}/g, post.timezone)
      .replace(/"{{created}}"/g, JSON.stringify(created))
      .replace(/{{created}}/g, created)
      .replace(/"{{updated}}"/g, JSON.stringify(updated))
      .replace(/{{updated}}/g, updated)
      .replace(/"{{uuid}}"/g, JSON.stringify(post.uuid))
      .replace(/{{uuid}}/g, post.uuid)
      .replace(/"{{slug}}"/g, JSON.stringify(post.slug))
      .replace(/{{slug}}/g, post.slug);

    if (post._frontMatter.trim()) {
      post._filestr = post._frontMatter + "\n\n" + post.content;
    } else {
      post._filestr = post.content;
    }

    Post._addHref(post);

    return post;
  };
  Post._formatFrontmatter = function (_key, val, system) {
    // 2021-07-01T13:59:59-0600
    // => 2021-07-01 1:59:59 pm
    if ("Zola" === system) {
      // TODO make this a property of the system, like 'pathname'
      return val;
    }
    var parts = val.split("T");
    var date = parts[0];
    var time = parts[1];
    var times = time.replace(/([-+]\d{4}|Z)$/g, "").split(":");
    var hour = parseInt(times[0], 10) || 0;
    var meridian = "am";
    if (hour >= 12) {
      hour -= 12;
      meridian = "pm";
      times[0] = hour;
    }
    times[0] = hour;
    times[2] = "00";
    // 2021-07-01 + ' ' + 1:59:59 + ' ' +  pm
    return date + " " + times.join(":") + " " + meridian;
  };
  Post._addHref = function (post) {
    var blog = BlogModel.getByPost(post) || {
      repo: post._repo,
      githost: post._githost,
      gitbranch: post._gitbranch,
      blog: post._blog,
    };
    var pathname = (Post._systems[blog.blog] || Post._systems.hugo).pathname;
    if (!Post._systems[blog.blog]) {
      console.warn(
        "Warning: blog system not specified or unsupported, assuming hugo",
        blog.blog
      );
    }
    pathname = encodeURI(pathname);

    // construct href
    var href = "";
    var content = encodeURIComponent(post._filestr);
    switch (blog.githost) {
      case "gitea":
        href =
          "/_new/" +
          blog.gitbranch +
          "?filename=" +
          pathname +
          "/" +
          post.slug +
          ".md&value=" +
          content;
        break;
      case "github":
      /* falls through */
      case "gitlab":
      /* falls through */
      default:
        href =
          "/new/" +
          blog.gitbranch +
          "?filename=" +
          pathname +
          "/" +
          post.slug +
          ".md&value=" +
          content;
    }

    // issue warnings if needed
    switch (blog.githost) {
      case "gitea":
        break;
      case "github":
        break;
      case "gitlab":
        window.alert(
          "GitLab doesn't have query param support yet.\n\n" +
            "See https://gitlab.com/gitlab-org/gitlab/-/issues/337038"
        );
        break;
      default:
        // TODO log error
        console.warn(
          "Warning: blog.githost was not specified or unsupported, assuming github",
          blog.githost
        );
    }

    post._href = post._repo + href;

    return post;
  };
  Post._liveFormPreview = function (post) {
    if (post._filename && post.content) {
      $(".js-preview-container").hidden = false;
      $(".js-filename").innerText = post._filename;
      $(".js-preview").innerText = post._filestr;
    } else {
      $(".js-preview-container").hidden = true;
    }

    $('textarea[name="description"]').value = post.description;
    $(".js-description-length").innerText = post.description.length;
    // TODO put colors in variables
    if (post.description.length > 155) {
      $(".js-description-length").style.color = "#F60208";
    } else if (post.description.length > 125) {
      $(".js-description-length").style.color = "#FD9D19";
    } else {
      $(".js-description-length").style.removeProperty("color");
    }

    $("span.js-githost").innerText = $(
      'select[name="githost"] option:checked'
    ).innerText.split(" ")[0];
    // ex: https://github.com/beyondcodebootcamp/beyondcodebootcamp.com/

    $("a.js-commit-url").href = post._href;

    $("code.js-raw-url").innerText = $("a.js-commit-url").href;
    return post;
  };

  /**
   *
   * Post is the View
   *
   */

  // TODO JSDoc
  // https://gist.github.com/NickKelly1/bc372e5993d7b8399d6157d82aea790e
  // https://gist.github.com/wmerfalen/73b2ad08324d839e3fe23dac7139b88a

  /**
   * @typedef {{
   *  title: string;
   *  slug: string;
   *  description: string;
   *  date: Date;
   *  lastmod: Date;
   * }} BlissPost
   *
   */

  /**
   * @returns {BlissPost}
   */
  PostModel.create = function () {
    PostModel._current = PostModel.getOrCreate();
    localStorage.setItem("current", PostModel._current.uuid);
    PostModel.save(PostModel._current);
    return PostModel._current;
  };

  /**
   * @param {string} uuid
   * @returns {BlissPost}
   */
  PostModel.getOrCreate = function (uuid) {
    // Meta
    var post = JSON.parse(
      localStorage.getItem("post." + uuid + ".meta") || "{}"
    );
    post.uuid = uuid || PostModel._uuid();
    if (!post.timezone) {
      post.timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    if (!post.created) {
      post.created = XTZ.toTimeZone(new Date(), post.timezone).toISOString();
    }
    if (!post.updated) {
      post.updated = post.created;
    }

    // Content
    post.content = localStorage.getItem("post." + post.uuid + ".data") || "";
    if (!post.description) {
      post.description = PostModel._parseDescription(post);
    }
    if (!post.title) {
      post.title = localStorage.getItem(post.uuid + ".title") || "";
    }
    // TODO is there a better way to handle this?
    post._previous = { title: post.title };

    // Blog
    // TODO post.blog_id
    // TODO BlogsModel.get(post.blog_id)
    if (!post._repo) {
      post._repo = "";
    }
    if (!post._gitbranch) {
      post._gitbranch = "main";
    }

    return post;
  };

  PostModel.ids = function () {
    return _localStorageGetIds("post.", ".meta");
  };

  PostModel.save = function (post) {
    var all = PostModel.ids();
    if (!all.includes(post.uuid)) {
      all.push(post.uuid);
      localStorage.setItem("all", all.join(PostModel._uuid_sep).trim());
    }

    localStorage.setItem(
      "post." + post.uuid + ".meta",
      JSON.stringify({
        title: post.title,
        description: post.description,
        uuid: post.uuid,
        slug: post.slug,
        created: post.created,
        updated: post.updated,
        timezone: post.timezone,
        // TODO iterate over localStorage to upgrade
        blog_id: post._repo + "#" + post._gitbranch,
        _blog: post._blog,
        _githost: post._githost,
        _gitbranch: post._gitbranch,
        _repo: post._repo,
      })
    );
    localStorage.setItem("post." + post.uuid + ".data", post.content);
  };

  PostModel.delete = function (uuid) {
    localStorage.removeItem("post." + uuid + ".meta");
    localStorage.removeItem("post." + uuid + ".content");
  };

  PostModel._getRandomValues = function (arr) {
    var len = arr.byteLength || arr.length;
    var i;
    for (i = 0; i < len; i += 1) {
      arr[i] = Math.round(Math.random() * 255);
    }
    return arr;
  };

  PostModel._uuid = function () {
    var rnd = new Uint8Array(18);
    PostModel._getRandomValues(rnd);
    var hex = [].slice
      .apply(rnd)
      .map(function (ch) {
        return ch.toString(16);
      })
      .join("")
      .split("");
    hex[8] = "-";
    hex[13] = "-";
    hex[14] = "4";
    hex[18] = "-";
    hex[19] = (8 + (parseInt(hex[19], 16) % 4)).toString(16);
    hex[23] = "-";
    return hex.join("");
  };

  PostModel._uuid_sep = " ";

  PostModel._toSlug = function (str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-/g, "")
      .replace(/-$/g, "")
      .trim();
  };

  PostModel._toInputDatetimeLocal = function (
    d = new Date(),
    tz = new Intl.DateTimeFormat().resolvedOptions().timeZone
  ) {
    // TODO
    // It's quite reasonable that a person may create the post
    // in an Eastern state on New York time and later edit the
    // same post in a Western state on Mountain Time.
    //
    // How to we prevent the time from being shifted accidentally?
    //
    // ditto for updated at
    /*
  if ("string" === typeof d) {
    return d.replace(/([+-]\d{4}|Z)$/, '');
  }
  */
    d = new Date(d);
    return (
      [
        String(d.getFullYear()),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-") +
      "T" +
      [
        String(d.getHours()).padStart(2, "0"),
        String(d.getMinutes()).padStart(2, "0"),
      ].join(":")
    );
  };

  PostModel._parseTitle = function (text) {
    // split on newlines and grab the first as title
    var title = text.split(/[\r\n]/g)[0];
    if (title.includes("#")) {
      title = title.split("#").slice(1).join("#").trim();
    }
    return title;
  };

  PostModel._parseDescription = function (post) {
    var description = post.content.slice(0, 152);
    if (152 === description.length) {
      description = description.slice(0, description.lastIndexOf(" "));
      description += "...";
    }
    return description;
  };

  /**
   *
   * Post is the View
   *
   */
  BlogModel.getByPost = function (post) {
    var id = post.blog_id;
    // deprecate
    if (post._repo) {
      id = post._repo.replace(/\/$/, "") + "#" + (post._gitbranch || "main");
    }
    return BlogModel.get(id);
  };
  BlogModel.get = function (id) {
    // repo+#+branch
    var json = localStorage.getItem("blog." + id);
    if (!json) {
      return null;
    }

    return JSON.parse(json);
  };

  BlogModel.save = function (blogObj) {
    // blog.https://github.com/org/repo#main
    var key = "blog." + blogObj.repo + "#" + blogObj.gitbranch;
    localStorage.setItem(
      key,
      JSON.stringify({
        repo: blogObj.repo,
        gitbranch: blogObj.gitbranch,
        githost: blogObj.githost,
        blog: blogObj.blog, // system (ex: Hugo)
      })
    );
  };

  BlogModel.all = function (blogObj) {
    return _localStorageGetAll("blog.");
  };

  BlogModel._splitRepoBranch = function (repo, _branch) {
    // TODO trim trailing /s
    var parts = repo.split("#");
    repo = parts[0].replace(/\/+$/, "");
    var branch = parts[1] || "";
    if (!branch || "undefined" === branch) {
      branch = _branch;
    }
    return { repo: repo, gitbranch: branch };
  };

  /*
   * inits
   *
   */
  Blog._init = function () {
    Blog._typeaheadTmpl = $("#-repos").innerHTML;
    Blog._renderRepoTypeaheads();
    // hotfix
    BlogModel.all().forEach(function (blog) {
      // https://github.com/org/repo (no #branchname)
      var parts = BlogModel._splitRepoBranch(blog.repo, blog.gitbranch);
      blog.repo = parts.repo;
      blog.gitbranch = parts.gitbranch;
      if (!blog.gitbranch) {
        // TODO delete
      }
      BlogModel.save(blog);
    });
  };

  Post._init = function () {
    // build template strings
    Post._rowTmpl = $(".js-row").outerHTML;
    $(".js-row").remove();

    // show all posts
    Post._renderRows();

    // load most recent draft
    Post._deserialize(PostModel._current.uuid);
  };

  PostModel._init = function () {
    // TODO XXX XXX
    PostModel._current = PostModel.getOrCreate(localStorage.getItem("current"));
  };

  PostModel._init();
  Post._init();
  Blog._init();

  // deprecated
  localStorage.removeItem("all");

  async function _init() {
    var url = new URL(window.document.location);
    // for testing in development
    if ("localhost" === url.hostname) {
      url.port = 80;
      url.host = "foo.github.io";
      url.pathname = "my-blissful-project";
    }
    if (!url.host.endsWith(".github.io")) {
      return;
    }
    var user = url.host.split(".")[0];
    var project = url.pathname.split("/").filter(Boolean)[0];
    var repo = "https://github.com/" + user + "/" + project;
    $('input[name="repo"]').value = repo;
    var event = new Event("change");
    $('input[name="repo"]').dispatchEvent(event);
  }
  _init();
})();
