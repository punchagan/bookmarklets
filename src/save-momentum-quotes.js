// Save Momentum Quotes as a JSON file

javascript: void (function () {
  if (
    window.location.protocol !== "moz-extension:" ||
    window.location.pathname !== "/dashboard.html"
  ) {
    alert("To download Momentum Quotes, run the bookmarklet in a new empty tab!");
    return;
  }
  let quotes = Object.entries(localStorage)
    .filter(([key, value]) => key.indexOf("momentum-quote-") > -1)
    .reduce((acc, [_, value]) => [...acc, JSON.parse(value)], [])
    .map(({ _id, forDate, body, source, is_favorite, twitter }) => ({
      _id,
      forDate,
      body,
      source,
      is_favorite,
      twitter,
    }));

  let data = [JSON.stringify(quotes, undefined, 2)],
    blob = new Blob(data, { type: "text/json" }),
    a = document.createElement("a");

  a.download = "momentum-quotes.json";
  a.href = window.URL.createObjectURL(blob);
  a.click();
})();
