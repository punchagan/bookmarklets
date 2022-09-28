// Download profile links from a roster as a CSV

// #### Usage:
// Navigate to the roster page and click the bookmarklet

javascript: void (function() {
  const getName = () => {
    const URLparts = location.pathname.split("/");
    const n = URLparts.length - 1;
    return URLparts[n] === "roster" ? URLparts[n - 1] : URLparts[n];
  };

  const data = Array.from(document.querySelectorAll(".media-item-tile"))
    .map(x => `"${x.querySelector("h3").textContent}",${x.href}`)
    .join("\n");

  const blob = new Blob([data], { type: "text/csv" });
  const a = document.createElement("a");

  a.download = `${getName()}.csv`;
  a.href = window.URL.createObjectURL(blob);
  a.click();
})();
