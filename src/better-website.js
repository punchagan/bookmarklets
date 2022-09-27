// Use rules from http://bettermotherfuckingwebsite.com to make websites more readable

javascript: void (function () {
  var style = document.createElement("style");
  document.head.appendChild(style);
  var sheet = style.sheet;
  sheet.insertRule(
    "body{ margin:40px auto; max-width:650px; line-height:1.6; font-size:18px; color:#444; padding:0 10px; }"
  );
  sheet.insertRule("h1,h2,h3{ line-height:1.2 }");
})();
