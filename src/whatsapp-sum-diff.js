// Find the difference between combination of two groups (A & B) and another
// group (C)

// #### Usage

// 1. Navigate to group A in WhatsApp Web, wait until the member information is
// populated (in the group heading) and click the bookmarklet.

// 2. Navigate to group B, wait until the member information is populated (in
// the group heading) and click the bookmarklet.

// 2. Finally, Navigate to group C, wait until the member information is
// populated and click the bookmarklet.

javascript: void (function () {
  const groupInfo = () => {
    const elements = document.querySelectorAll("#main span[title]");
    const name = elements[0].textContent;
    const members = elements[1].textContent.replace(/ /g, "").split(",");
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
  if (!window.groupA) {
    window.groupA = group;
    alert(`Captured info for group A\nName: ${group.name}\nMembers: ${group.members.length}`);
  } else if (!window.groupB) {
    window.groupB = group;
    alert(`Captured info for group B\nName: ${group.name}\nMembers: ${group.members.length}`);
  } else {
    const { groupA, groupB } = window;
    delete window.groupA;
    delete window.groupB;
    const combinedGroup = {
      name: `${groupA.name} & ${groupB.name}`,
      members: groupA.members.concat(groupB),
    };
    diff(group, combinedGroup);
    diff(combinedGroup, group);
  }
})();
