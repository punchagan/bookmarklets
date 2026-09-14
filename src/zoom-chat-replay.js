// Create a Zoom chat replay from a downloaded transcript

// This bookmarklet is for use with a Zoom video recording that has been
// uploaded to Google Drive, along with the chat transcript. The video and the
// transcript are assumed to have 'Anyone with link' can view permissions. The
// bookmarklet creates a chat replay UI next to the video player on the Google
// Drive page.
//
// NOTE: This has only been tested with Zoom transcripts with English language
// setting in Zoom. Other languages are not supported.

javascript: void (async function () {
  const replayDivId = "chat-replay";
  const statusId = "chat-replay-status";

  const setStatus = (message) => {
    let statusDiv = document.querySelector(`#${statusId}`);
    if (!statusDiv) {
      console.error("Status div not found");
    }
    statusDiv.innerText = message;
  };

  const createInputUI = () => {
    // Find parentEl to insert chat replay UI
    let videoEl;
    for (let i = 0; i < 10; i++) {
      videoEl = document.querySelector(
        `#drive-viewer-video-player-object-${i}`,
      );
      if (!!videoEl) break;
    }
    if (!videoEl) {
      alert("Couldn't find the video player");
      return;
    }
    const siblingEl = videoEl.parentElement.parentElement;
    const parentEl = siblingEl.parentElement;

    let chatReplayDiv = document.querySelector(`#${replayDivId}`);
    if (!chatReplayDiv) {
      chatReplayDiv = document.createElement("div");
      chatReplayDiv.setAttribute("id", replayDivId);
      parentEl.append(chatReplayDiv);
    }
    chatReplayDiv.style.cssText = siblingEl.style.cssText;

    // Compute width
    const width =
      (document.documentElement.clientWidth - siblingEl.clientWidth - 50) / 2;
    chatReplayDiv.style.width = `${width}px`;
    chatReplayDiv.style.position = "absolute";
    chatReplayDiv.style.top = siblingEl.offsetTop + "px";
    chatReplayDiv.style.left =
      siblingEl.offsetLeft + siblingEl.clientWidth + "px";
    chatReplayDiv.style.backgroundColor = "#e5ddd5";
    chatReplayDiv.style.overflow = "hidden";

    // Create status div
    let statusDiv = document.querySelector(`#${statusId}`);
    if (!statusDiv) {
      statusDiv = document.createElement("div");
      statusDiv.setAttribute("id", statusId);
      chatReplayDiv.append(statusDiv);
    }
  };

  // Used only for POST request for downloading the transcript from Google Drive
  const fetchParams = {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "X-Drive-First-Party": "DriveWebUi",
      "X-Json-Requested": "true",
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      "Alt-Used": "drive.usercontent.google.com",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      Priority: "u=0",
    },
    referrer: "https://drive.google.com/",
    method: "POST",
    mode: "cors",
  };
  const getChatDownloadUrl = async (url) => {
    try {
      const response = await fetch(url, fetchParams);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const result = await response.text();
      const data = result.substring(4);
      const downloadUrl = JSON.parse(data)?.downloadUrl;
      return downloadUrl;
    } catch (error) {
      console.error(error.message);
    }
  };

  const shareUrlToDownloadUrl = (url) => {
    const match = url.match(/file\/d\/(\w+)/);
    if (!match) {
      setStatus("Invalid Google Drive share URL. Please use the Share URL");
      return null;
    }
    const fileId = match[1];
    return `https://drive.google.com/uc?id=${fileId}&authuser=0&export=download`;
  };

  const downloadChatText = async (url) => {
    const downloadUrl = await getChatDownloadUrl(shareUrlToDownloadUrl(url));
    if (!downloadUrl) {
      alert("failed to get downloadable URL!");
      return;
    }
    console.log(`Obtained URL. Downloading ...`);
    setStatus("Downloading chat transcript ...");
    statusDiv = document.querySelector(`#${statusId}`);
    statusDiv.innerText = "Downloading chat transcript ...";
    // Download the chat transcript; No credentials since the download URL is
    // public and fails with credentials
    const response = await fetch(downloadUrl, {
      method: "GET",
      mode: "cors",
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    statusDiv.innerText = "";
    return await response.text();
  };

  const parseChatText = (text) => {
    setStatus("Parsing chat transcript ...");
    // Split the text into lines starting at timestamps
    const lines = text.split(/\n(?=\d{2}:\d{2}:\d{2})/);
    console.log(`Parsed ${lines.length} chat lines`);
    let messages = [];
    lines.forEach((line, idx) => {
      const trimmedLine = line.replace(/[\u200B-\u200D\uFEFF]/g, "").trim(); // Remove zero-width characters and trim whitespace
      const match = trimmedLine.match(
        /(\d{2}:\d{2}:\d{2})\s+From (.+?) : ([\s\S]*)/,
      );
      if (match) {
        const timestamp = match[1];
        const sender = match[2];
        let message = match[3];
        let originalMessage = null;
        const isReply = message.startsWith("Replying to");
        const isReaction = message.startsWith("Reacted to");
        if (isReply) {
          // Find the original message and the actual reply text
          // Message is in the format "Replying to "<original message>"\n\n<reply text>"
          const replyMatch = message.match(
            /Replying to "([\s\S]+?)"\s?\n\n\s?([\s\S]*)\s*$/,
          );
          if (replyMatch) {
            originalMessage = replyMatch[1].trim().replace(/"$/, "").trim();
            message = replyMatch[2];
          } else {
            console.warn(
              `Failed to parse reply message from line: ${JSON.stringify(
                line,
              )}\n`,
            );
          }
        } else if (isReaction) {
          // Find the original message and the actual reaction text
          // Message is in the format "Reacted to "<original message>" with "<reaction text>"
          // The quotes are optional! stupid shit
          const reactionMatch = message.match(
            /Reacted to "?([\s\S]+)"? with "?(.)"?/,
          );
          if (reactionMatch) {
            originalMessage = reactionMatch[1].trim().replace(/"$/, "").trim();
            message = reactionMatch[2];
          } else {
            console.warn(`Failed to parse reaction message: ${message}`);
          }
        }
        const originalMessageStripped = originalMessage
          ?.replace(/\.\.\.$/, "")
          .replace(/…$/, "");
        const originalTruncated =
          originalMessage && originalMessage !== originalMessageStripped;
        const parsedMessage = {
          id: idx,
          timestamp,
          sender,
          message: message.trim().replace(/\r/g, "\n"),
          replyTo: isReply
            ? messages.find((msg) =>
                originalTruncated
                  ? msg.message.startsWith(originalMessageStripped)
                  : msg.message === originalMessage,
              )?.id
            : null,
          reactionTo: isReaction
            ? messages.find((msg) =>
                originalTruncated
                  ? msg.message.startsWith(originalMessageStripped)
                  : msg.message === originalMessage,
              )?.id
            : null,
        };
        // Try truncating the original message and search again. Some
        // characters seem to get bungled up in the Zoom transcripts in quoted
        // messages.
        if (isReaction && !parsedMessage.reactionTo) {
          parsedMessage.reactionTo = messages.find((msg) =>
            msg.message.startsWith(originalMessage.slice(0, 40).trim()),
          )?.id;
        }
        if (isReply && !parsedMessage.replyTo) {
          parsedMessage.replyTo = messages.find((msg) =>
            msg.message.startsWith(originalMessage.slice(0, 40).trim()),
          )?.id;
        }
        messages.push(parsedMessage);
      } else {
        console.warn(`Failed to parse line: ${line}`);
      }
    });
    setStatus("");
    return messages;
  };

  const displayMessages = (messages) => {
    const messagesId = "chat-replay-messages";
    const messagesExist = document.querySelector(`#${messagesId}`);
    if (messagesExist) {
      messagesExist.remove();
    }
    const chatReplayDiv = document.querySelector(`#${replayDivId}`);
    if (!chatReplayDiv) {
      console.error("Chat replay div not found");
      return;
    }
    const messagesDiv = document.createElement("div");
    messagesDiv.setAttribute("id", messagesId);
    messagesDiv.style.cssText = `
      overflow-y: auto;
      height: 100%;
      padding: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    messages.forEach((msg) => {
      if (msg.reactionTo) {
        return; // Skip reactions, they will be displayed with the original message
      }
      const reactions = messages
        .filter((m) => m.reactionTo === msg.id)
        ?.map((m) => m.message);
      const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction] = (acc[reaction] || 0) + 1;
        return acc;
      }, {});
      const originalMessage = msg.replyTo ? messages[msg.replyTo] : null;

      // Display the message with timestamp, sender, and message text. Show
      // truncated original message if it's a reply (with sender info) and any
      // reactions we found to the message.
      //
      // TODO:

      messagesDiv.appendChild(msgDiv);
    });
    chatReplayDiv.appendChild(messagesDiv);
  };

  createInputUI();
  let chatText = window?.chatText || null;
  if (!chatText) {
    const url = prompt("Enter Chat Transcript URL");
    chatText = await downloadChatText(url);
    window.chatText = chatText;
  }
  const messages = parseChatText(chatText);
  displayMessages(messages);
})();
