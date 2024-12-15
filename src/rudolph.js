// Rudolph helps organize Secret Santa ...

// 1. Setup a Google spreadsheet with "Name" & "Whatsapp Name" columns with all
//    participants. The sheet name should be participants. Make the sheet
//    downloadable by everyone with URL.
// 1. Optionally, add an "Avoid Kiddos" column with a comma-separated list of
//    participants to avoid assigning as kiddos to a person.
// 1. In any tab, maybe the bookmarklets site tab, run the bookmarklet to fetch
//    all participants.
// 1. Copy the participants to Clipboard by clicking the new button.
// 1. In the WhatsApp Web tab, close any open chats.
// 1. Run the bookmarklet again and copy the participants JSON into the prompt.
// 1. Profit!

const sendEnter = async (element) => {
  const enterEvent = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Enter",
    code: "Enter",
  });
  element.dispatchEvent(enterEvent);
  await new Promise(function (r) {
    setTimeout(r, 2000);
  });
};

const sendMessage = async (santaId, santa, kiddo) => {
  console.log(`Sending message to ${santa}!!`);
  const searchBox = document.querySelector(
    "div[contenteditable='true'][data-tab='3']",
  );
  searchBox.focus();
  document.execCommand("insertText", false, santaId);
  // Wait for search results to populate
  await new Promise(function (r) {
    setTimeout(r, 5000);
  });
  await sendEnter(searchBox);

  const filler = `🎁 ${" ".repeat(50)} 🎁\n`;

  const message = `Hi *${santa}*,\n\n\nYou are the Secret Santa for ...\n
${filler.repeat(10)}
 🔽${" ".repeat(15)} Scroll down ${" ".repeat(15)}🔽\n
${filler.repeat(10)}\n\n
*${kiddo}*!\n\n
🎅🎁 Please keep it a secret and make it special!\n\n
Powered by Rudolph, a Bookmarklet: https://punchagan.github.io/bookmarklets/#rudolph`;

  document.execCommand("insertText", false, message);
  // Wait for search results to populate
  await new Promise(function (r) {
    setTimeout(r, 500);
  });
  const sendButton = document.querySelector("button[aria-label='Send']");
  sendButton.click();
  await new Promise(function (r) {
    setTimeout(r, 500);
  });
  // Close the chat
  document.querySelector('#main div[title="Menu"]')?.click();
  await new Promise(function (r) {
    setTimeout(r, 200);
  });
  document.querySelector('div[aria-label="Close chat"]')?.click();
  await new Promise(function (r) {
    setTimeout(r, 200);
  });
  // Go back to the chat list
  document.querySelector('div[aria-label="Back"]')?.click();
  document.querySelector("#side")?.click();
};

const fetchParticipants = async () => {
  // Prompt for the spreadsheet ID
  const sheetId = prompt(
    "Enter the Google Spreadsheet ID containing participants:",
  );
  if (!sheetId) return alert("No spreadsheet ID provided.");
  console.log(`Sheet: ${sheetId}`);
  // Fetch participants from the spreadsheet
  const url = `https://opensheet.elk.sh/${sheetId}/participants`;
  let participants;
  try {
    const response = await fetch(url);
    participants = await response.json();
  } catch (error) {
    return alert(
      "Failed to fetch participant data. Ensure the spreadsheet ID is correct.",
    );
  }

  if (!participants || participants.length < 2) {
    return alert(
      "Not enough participants found. Ensure the spreadsheet has at least two participants.",
    );
  }
  // Ask the user to trigger a manual clipboard copy
  const clipboardButton = document.createElement("button");
  clipboardButton.textContent = "Copy Participants to Clipboard";
  clipboardButton.style.position = "fixed";
  clipboardButton.style.top = "10px";
  clipboardButton.style.right = "10px";
  clipboardButton.style.zIndex = "1000";
  clipboardButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(participants));
      alert(
        "Participants copied to clipboard. Open WhatsApp Web and run the script again.",
      );
    } catch (err) {
      alert(`Failed to copy to clipboard: ${err.message}`);
    }
    document.body.removeChild(clipboardButton);
  });
  document.body.appendChild(clipboardButton);
};

const generateShuffledAssignments = async (participants) => {
  // Shuffle participants and assign kiddos
  let shuffled = [...participants].sort();
  for (let i = 0; i < participants.length * 50; i++) {
    shuffled = [...shuffled].sort(() => Math.random() - 0.5);
  }
  const assignments = shuffled.map((participant, i) => {
    return {
      santa: participant["Name"],
      santaId: participant["WhatsApp Name"],
      kiddo: shuffled[(i + 1) % shuffled.length]["Name"],
    };
  });
  return assignments.sort(() => Math.random() - 0.5);
};

const generateAssignmentsWithConstraints = (participants) => {
  const assignments = [];
  const usedKiddos = new Set();

  const validKiddo = (santa, kiddo) => {
    return (
      !santa["Avoid Kiddos"]?.includes(kiddo.Name) && kiddo.Name !== santa.Name
    );
  };

  // Helper function to find a valid kiddo for a given Santa
  const findValidKiddo = (santa, availableKiddos) => {
    for (const kiddo of availableKiddos) {
      if (validKiddo(santa, kiddo)) {
        return kiddo;
      }
    }
    return null;
  };

  // Recursive backtracking function
  const assignSanta = (index) => {
    if (index >= participants.length) {
      // All participants have been assigned
      return true;
    }

    const santa = participants[index];
    const availableKiddos = participants.filter((p) => !usedKiddos.has(p.Name));
    const shuffledKiddos = [...availableKiddos].sort(() => Math.random() - 0.5);

    for (const kiddo of shuffledKiddos) {
      if (validKiddo(santa, kiddo)) {
        // Assign this kiddo to the Santa
        assignments.push({
          santa: santa.Name,
          santaId: santa["WhatsApp Name"],
          kiddo: kiddo.Name,
        });
        usedKiddos.add(kiddo.Name);

        // Recurse to assign the next Santa
        if (assignSanta(index + 1)) {
          return true;
        }

        // Backtrack: remove the assignment and try another kiddo
        assignments.pop();
        usedKiddos.delete(kiddo.Name);
      }
    }

    // No valid kiddo found for this Santa
    return false;
  };

  // Start the assignment process
  if (!assignSanta(0)) {
    throw new Error(
      "Unsolvable constraints: Unable to generate valid assignments.",
    );
  }

  return assignments;
};

const generateAssignments = (participants) => {
  useConstraints = participants.some((p) => p["Avoid Kiddos"]);
  console.log(`Using constraints: ${useConstraints}`);
  return useConstraints
    ? generateAssignmentsWithConstraints(participants)
    : generateShuffledAssignments(participants);
};

const main = async () => {
  if (!window.location.href.includes("web.whatsapp.com")) {
    await fetchParticipants();
  } else {
    const participantsJSON = prompt(
      "Enter the assignments after fetching them on a different tab; WhatsApp Web tab doesn't allow fetching data.",
    );
    const participants = JSON.parse(participantsJSON);
    participants.map((p) => {
      p["Avoid Kiddos"] = p["Avoid Kiddos"]?.split(",").map((k) => k.trim());
    });
    const assignments = generateAssignments(participants);
    for (const assignment of assignments) {
      await sendMessage(assignment.santaId, assignment.santa, assignment.kiddo);
      await new Promise(function (r) {
        setTimeout(r, 1000);
      });
    }
  }
};

// Export functions for testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateAssignments };
}
