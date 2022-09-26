// Compare the difference between two WhatsApp groups

// #### Usage

// 1. Create a new bookmark in your browser, and add the following code as the
// URL. (Exclude this comment)
// 2. Navigate to the first group and click the bookmark.
// 3. Navigate to the second group and click the bookmark. Open the browser
// console to see the diff output printed.

javascript: void (function () {
  const diff = function (a, b) {
    const missing = a.members.filter((name) => !b.members.includes(name));
    const msg = `List of people in ${a.name} but not in ${b.name}`;
    const names = missing.join("\n");
    const count = `${missing.length} people`;
    console.log(`${msg}\n${names}\n${count}`);
  };
  const elements = document.querySelectorAll("#main span[title]");
  const name = elements[0].textContent;
  const members = elements[1].textContent.replace(/ /g, "").split(",");
  const group = { name, members };

  if (!window.firstGroup) {
    window.firstGroup = group;
    console.log("Captured info for first group");
  } else {
    const { firstGroup } = window;
    delete window.firstGroup;
    diff(group, firstGroup);
    diff(firstGroup, group);
  }
})();
