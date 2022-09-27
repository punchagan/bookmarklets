// Create a new elfeed entry from a website using an org-capture protocol

javascript: void (function () {
  const url_element =
    document.querySelector('link[type="application/rss+xml"]') ||
    document.querySelector('link[type="application/atom+xml"]') ||
    location;
  const url = url_element.href;
  location.href =
    "org-protocol://capture://L/" +
    encodeURIComponent(url) +
    "/" +
    encodeURIComponent(document.title);
})();
