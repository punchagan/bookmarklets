// Compare and find the difference between two WhatsApp groups

// #### Usage

// 1. Visit https://web.whatsapp.com/

// 1. Navigate to the first group, wait until the member information is
// populated (in the group heading) and click the bookmarklet.

// 2. Navigate to the second group, wait until the member information is
// populated and click the bookmarklet.

javascript: void (function () {
  const groupInfo = () => {
    const elements = document.querySelectorAll("#main span[title]");
    const name = elements[0].textContent;
    const subtitle = elements[1].textContent;
    if (subtitle === "click here for group info") {
      return { name, members: [] };
    }
    const members = subtitle.replace(/ /g, "").split(",");
    return { name, members };
  };
  const diff = function (a, b) {
    const missing = a.members.filter((name) => !b.members.includes(name));
    const msg = `List of people in ${a.name} but not in ${b.name}`;
    const names = missing.join("\n");
    const count = `${missing.length} people`;
    alert(`${msg}\n${names}\n${count}`);
  };
  if (window.location.hostname !== "web.whatsapp.com") {
    alert("Make sure that the current tab is the WhatsApp Web tab.");
    return;
  }
  const group = groupInfo();
  if (group.members.length === 0) {
    alert("Could not get members info. Wait until the member list shows up in the group heading");
  } else if (!window.firstGroup) {
    window.firstGroup = group;
    alert(`Captured info for first group\nName: ${group.name}\nMembers: ${group.members.length}`);
  } else {
    const { firstGroup } = window;
    delete window.firstGroup;
    diff(group, firstGroup);
    diff(firstGroup, group);
  }
})();
