// More Readable Kindle Highlights, downloadable as Markdown or Org files

// #### Usage:

// 1. Visit https://read.amazon.com/notebook
// 2. Navigate to the required book
// 3. Use the bookmarklet
// 4. Profit!

javascript: void (function () {
  const highlights_markdown = () => {
    const markdown = "";
    for (let i = 0; i < highlights.length; i++) {
      markdown += "> " + highlights[i] + "\n\n";
      const note = notes[i];
      if (note !== "") {
        markdown += note + "\n\n";
      }
    }
    return markdown;
  };

  const highlights_orgmode = () => {
    const orgmode = "";
    for (let i = 0; i < highlights.length; i++) {
      orgmode += "#+BEGIN_QUOTE\n";
      orgmode += highlights[i] + "\n";
      orgmode += "#+END_QUOTE\n\n";
      const note = notes[i];
      if (note !== "") {
        orgmode += note + "\n\n";
      }
    }
    return orgmode;
  };

  const add_download_links = () => {
    const parent = $(".kp-notebook-bookcover-container").parent();
    add_download_link(parent, "markdown");
    add_download_link(parent, "x-org");
  };

  const add_download_link = (parent, mimetype) => {
    const a = $("<a />");
    let blob, url, name;
    if (mimetype == "markdown") {
      a.text("Download Markdown");
      blob = new Blob([highlights_markdown()], { type: "text/markdown" });
      name = "kindle-highlights.md";
    } else if (mimetype == "x-org") {
      a.text("Download Org-Mode");
      blob = new Blob([highlights_orgmode()], { type: "text/markdown" });
      name = "kindle-highlights.org";
    }
    url = window.URL.createObjectURL(blob);
    a.addClass("a-row").appendTo(parent).attr("href", url).attr("download", name);
  };

  const make_readable = () => {
    $("#library").hide();
    $(".kp-notebook-metadata").hide();
    $("h3.kp-notebook-metadata").show().parent().toggleClass("a-span5");
    $(".kp-notebook-bookcover-container").hide();
    $(".a-declarative").hide();
    $(".kp-notebook-row-separator").css("border-bottom", "none");
    $("#annotations").css("float", "none").css("max-width", "800px").css("margin", "auto");
    $(".a-scroller").css("overflow", "inherit");
    $(".a-size-small").hide();
  };

  make_readable();
  const highlights = $(".kp-notebook-row-separator")
    .find("#highlight")
    .map(function (idx, x) {
      return $(x).text();
    });
  const notes = $(".kp-notebook-row-separator")
    .find("#note")
    .map(function (idx, x) {
      return $(x).text();
    });
  add_download_links();
})();
