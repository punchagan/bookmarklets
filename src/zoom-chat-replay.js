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

  // All static CSS for the chat replay UI lives here, in one place, and is
  // injected into <head> once, before any DOM is built. Anything that
  // depends on runtime layout (position/top/left/width of #chat-replay) is
  // still set inline in createInputUI, since it can't be known up front.
  const styles = `
    #${replayDivId} {
      display: flex;
      flex-direction: column;
      background-color: #e5ddd5;
      overflow: hidden;
    }
    #${statusId} {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #075e54;
      padding: 4px 10px;
    }
    #chat-replay-messages {
      overflow-y: auto;
      flex: 1;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    .chat-replay-msg {
      background: #fff;
      border-radius: 7.5px;
      padding: 6px 9px 8px;
      margin-bottom: 6px;
      max-width: 85%;
      box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
      position: relative;
    }
    .chat-replay-sender {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .chat-replay-quote {
      background: rgba(0, 0, 0, 0.05);
      border-left: 4px solid;
      border-radius: 4px;
      padding: 4px 6px;
      margin-bottom: 4px;
      font-size: 12.5px;
      color: #667781;
    }
    .chat-replay-quote-sender {
      font-weight: bold;
      font-size: 12.5px;
      margin-bottom: 1px;
    }
    .chat-replay-quote-text {
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .chat-replay-text {
      font-size: 14.2px;
      color: #111b21;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .chat-replay-time {
      display: block;
      text-align: right;
      margin-top: 4px;
      font-size: 11px;
      color: #667781;
    }
    .chat-replay-reactions {
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .chat-replay-reaction {
      background: #fff;
      border: 1px solid #e9edef;
      border-radius: 12px;
      padding: 1px 6px;
      font-size: 12px;
      box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
    }
  `;

  const injectStyles = () => {
    const styleId = `${replayDivId}-style`;
    if (document.querySelector(`#${styleId}`)) {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("id", styleId);
    style.textContent = styles;
    document.head.append(style);
  };

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
            /Reacted to "?([\s\S]+)"? with "?(.)"?/u,
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

    // Deterministically map each sender's name to one of the colors, so the
    // same sender always gets the same color.
    const senderColors = [
      "#e542a3",
      "#d3691e",
      "#4a8cca",
      "#6b7fd7",
      "#5ab55e",
      "#c4548a",
      "#9c6fd6",
      "#3fa79b",
      "#e0793e",
      "#5f9ea0",
    ];
    const colorForSender = (sender) => {
      let hash = 0;
      for (let i = 0; i < sender.length; i++) {
        hash = (hash << 5) - hash + sender.charCodeAt(i);
        hash |= 0;
      }
      return senderColors[Math.abs(hash) % senderColors.length];
    };

    const findById = (id) => messages.find((m) => m.id === id);

    messages.forEach((msg) => {
      if (msg.reactionTo != null) {
        return; // Skip reactions, they will be displayed with the original message
      }
      const reactions = messages.filter((m) => m.reactionTo === msg.id);
      const reactionGroups = reactions.reduce((acc, reaction) => {
        (acc[reaction.message] ??= []).push(reaction.sender);
        return acc;
      }, {});
      const originalMessage =
        msg.replyTo != null ? findById(msg.replyTo) : null;
      const senderColor = colorForSender(msg.sender);

      // Display the message with timestamp, sender, and message text. Show
      // truncated original message if it's a reply (with sender info) and any
      // reactions we found to the message.
      const msgDiv = document.createElement("div");
      msgDiv.className = "chat-replay-msg";

      const senderDiv = document.createElement("div");
      senderDiv.className = "chat-replay-sender";
      senderDiv.style.color = senderColor;
      senderDiv.textContent = msg.sender;
      msgDiv.append(senderDiv);

      if (originalMessage) {
        const quoteDiv = document.createElement("div");
        quoteDiv.className = "chat-replay-quote";
        quoteDiv.style.borderLeftColor = colorForSender(originalMessage.sender);

        const quoteSenderDiv = document.createElement("div");
        quoteSenderDiv.className = "chat-replay-quote-sender";
        quoteSenderDiv.style.color = colorForSender(originalMessage.sender);
        quoteSenderDiv.textContent = originalMessage.sender;
        quoteDiv.append(quoteSenderDiv);

        const quoteTextDiv = document.createElement("div");
        quoteTextDiv.className = "chat-replay-quote-text";
        quoteTextDiv.textContent = originalMessage.message;
        quoteDiv.append(quoteTextDiv);

        msgDiv.append(quoteDiv);
      }

      const textDiv = document.createElement("div");
      textDiv.className = "chat-replay-text";
      textDiv.textContent = msg.message;
      msgDiv.append(textDiv);

      const timeSpan = document.createElement("span");
      timeSpan.className = "chat-replay-time";
      timeSpan.textContent = msg.timestamp;
      msgDiv.append(timeSpan);

      if (Object.keys(reactionGroups).length > 0) {
        const reactionsDiv = document.createElement("div");
        reactionsDiv.className = "chat-replay-reactions";
        Object.entries(reactionGroups).forEach(([reaction, senders]) => {
          const pill = document.createElement("span");
          pill.className = "chat-replay-reaction";
          pill.textContent =
            senders.length <= 4
              ? `${reaction} ${senders.join(", ")}`
              : `${reaction} ${senders.length}`;
          reactionsDiv.append(pill);
        });
        msgDiv.append(reactionsDiv);
      }

      messagesDiv.appendChild(msgDiv);
    });
    chatReplayDiv.appendChild(messagesDiv);
  };

  injectStyles();
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
