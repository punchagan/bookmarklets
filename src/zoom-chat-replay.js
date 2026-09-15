// Create a Zoom chat replay from a downloaded transcript

// This bookmarklet is for use with a Zoom video recording that has been
// uploaded to Google Drive, along with the chat transcript. The video and the
// transcript are assumed to have 'Anyone with link' can view permissions. The
// bookmarklet creates a chat replay UI next to the video player on the Google
// Drive page.
//
// NOTE: This has only been tested with Zoom transcripts with English language
// setting in Zoom. Other languages are not supported.
//
// #### Usage:
//
// 0. Install the bookmarklet. (See instructions at the top of this page).
//
// 1. Copy the share URL of the Zoom Chat Transcript that has been uploaded to
// Google Drive. NOTE: The transcript .txt file needs to be accessible to
// anyone with the link for this bookmarklet to be able to download it.

// 2. Start playing the video uploaded to Google Drive

// 3. Click on this bookmarklet and paste the share URL of the Zoom Chat
// Transcript in the newly created chat replay UI.

// 4. The video recording start time is "guessed" based on the timestamps in
// the transcript file. But, you can edit the start time in the UI to adjust
// the sync.

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
    #chat-replay-url-form {
      display: flex;
      gap: 6px;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    #chat-replay-url-form input {
      flex: 1;
      min-width: 0;
      padding: 6px 8px;
      font-size: 13px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    #chat-replay-url-form button {
      padding: 6px 10px;
      font-size: 13px;
      background: #075e54;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #chat-replay-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 10px;
      padding: 6px 10px;
      font-family: Arial, sans-serif;
      font-size: 12.5px;
      color: #075e54;
    }
    #chat-replay-start-time {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    #chat-replay-start-time input {
      box-sizing: border-box;
      height: 24px;
      font-size: 12.5px;
      padding: 2px 4px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    #chat-replay-search-message {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 140px;
    }
    #chat-replay-search-message input {
      box-sizing: border-box;
      height: 24px;
      width: 100%;
      font-size: 12.5px;
      padding: 2px 4px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    #chat-replay-search-message span {
      font-size: 11px;
    }
    #chat-replay-show-all {
      flex-shrink: 0;
      white-space: nowrap;
    }
    #chat-replay-show-all label {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    }
    #chat-replay-messages {
      overflow-y: auto;
      flex: 1;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    #chat-replay-jump-to-latest {
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: #075e54;
      color: #fff;
      border: none;
      border-radius: 16px;
      padding: 6px 14px;
      font-size: 12.5px;
      font-family: Arial, sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
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
      color: #111b21;
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
    const width = Math.min(
      (document.documentElement.clientWidth - siblingEl.clientWidth - 50) / 2,
      450,
    );
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
    setStatus("Processing chat transcript URL ...");
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

  // Resolves with the chat transcript text: from window.chatText if already
  // fetched, otherwise by showing a one-time URL input form in the replay
  // UI. Once a URL is submitted, the form is removed for good.
  const getChatText = () => {
    if (window.chatText) {
      return Promise.resolve(window.chatText);
    }
    return new Promise((resolve) => {
      const chatReplayDiv = document.querySelector(`#${replayDivId}`);
      const formId = "chat-replay-url-form";
      const form = document.createElement("form");
      form.setAttribute("id", formId);

      const input = document.createElement("input");
      input.type = "url";
      input.placeholder = "Paste chat transcript share URL";
      input.required = true;
      form.append(input);

      const button = document.createElement("button");
      button.type = "submit";
      button.textContent = "Load chat";
      form.append(button);

      chatReplayDiv.append(form);
      input.focus();

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const url = input.value.trim();
        if (!url) {
          return;
        }
        form.remove();
        const text = await downloadChatText(url);
        window.chatText = text;
        resolve(text);
      });
    });
  };

  // Chat timestamps and the video-start-time input are both plain
  // "HH:MM:SS" wall-clock strings; these convert between that and seconds
  // (from midnight) so they can be compared against video playback seconds.
  const parseTimestampToSeconds = (timestamp) => {
    const [hours, minutes, seconds] = timestamp.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const secondsToTimeString = (totalSeconds) => {
    const normalized = ((totalSeconds % 86400) + 86400) % 86400;
    const hours = Math.floor(normalized / 3600);
    const minutes = Math.floor((normalized % 3600) / 60);
    const seconds = Math.floor(normalized % 60);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
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
        const isReactionRemoval = message.startsWith("Removed a");
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
        } else if (isReactionRemoval) {
          // Find the original message and the removed reaction's emoji.
          // Message is in the format 'Removed a <emoji> reaction from "<original
          // message>"' - but Zoom sometimes drops the word "reaction".
          const removalMatch = message.match(
            /Removed a "?([\s\S]+?)"? (?:reaction )?from "?([\s\S]+)"?/u,
          );
          if (removalMatch) {
            message = removalMatch[1];
            originalMessage = removalMatch[2].trim().replace(/"$/, "").trim();
          } else {
            console.warn(
              `Failed to parse reaction removal message: ${message}`,
            );
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
          totalSeconds: parseTimestampToSeconds(timestamp),
          sender,
          message: message.trim().replace(/\r/g, "\n"),
          replyTo: isReply
            ? messages.find((msg) =>
                originalTruncated
                  ? msg.message.startsWith(originalMessageStripped)
                  : msg.message === originalMessage,
              )?.id
            : null,
          reactionTo:
            isReaction || isReactionRemoval
              ? messages.find((msg) =>
                  originalTruncated
                    ? msg.message.startsWith(originalMessageStripped)
                    : msg.message === originalMessage,
                )?.id
              : null,
          reactionRemoved: isReactionRemoval,
        };
        // Try truncating the original message and search again. Some
        // characters seem to get bungled up in the Zoom transcripts in quoted
        // messages.
        if (
          (isReaction || isReactionRemoval) &&
          !parsedMessage.reactionTo &&
          originalMessage
        ) {
          parsedMessage.reactionTo = messages.find((msg) =>
            msg.message.startsWith(originalMessage.slice(0, 40).trim()),
          )?.id;
        }
        if (isReply && !parsedMessage.replyTo && originalMessage) {
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

  // Renders messages progressively, in sync with video playback, instead of
  // all at once: Drive plays this video through an internal, YouTube-backed
  // iframe, which broadcasts periodic playback state via postMessage (see
  // https://developer.chrome.com/docs/extensions/mv3/messaging for the
  // general mechanism; the message shape itself is undocumented, learned by
  // eavesdropping on `window.addEventListener("message", console.log)`
  // while using the Drive player). Its `infoDelivery` messages carry
  // `info.currentTime` in video-playback seconds. Chat timestamps are
  // wall-clock "HH:MM:SS" strings, so a reference time (default: the
  // 10-minute mark at or before the first message, editable in the UI) maps
  // each message to a playback-second offset; messages are revealed as
  // `currentTime` passes their offset. Reactions are folded into their
  // target message's bubble using every reaction in the transcript,
  // regardless of whether its own timestamp has been reached yet - simpler
  // than live-updating already-rendered bubbles, at the cost of not
  // simulating reactions arriving late.
  const setupChatReplay = (messages) => {
    const messagesId = "chat-replay-messages";
    const startTimeId = "chat-replay-start-time";
    const chatReplayDiv = document.querySelector(`#${replayDivId}`);
    if (!chatReplayDiv) {
      console.error("Chat replay div not found");
      return;
    }

    // Fresh start on every invocation: drop any previous UI/listener state
    // left behind by a prior run of this bookmarklet.
    document.querySelector("#chat-replay-controls")?.remove();
    document.querySelector(`#${messagesId}`)?.remove();
    document.querySelector("#chat-replay-jump-to-latest")?.remove();
    if (window.__chatReplayMessageListener) {
      window.removeEventListener("message", window.__chatReplayMessageListener);
    }

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

    const messagesDiv = document.createElement("div");
    messagesDiv.setAttribute("id", messagesId);

    const renderMessage = (msg) => {
      // `messages` is in chronological order, so replaying each reaction
      // event (add or remove) for this message and keeping only the ones
      // still active at the end gives the net reactions - a "Removed a X
      // reaction" event cancels the matching earlier addition instead of
      // being counted as a reaction of its own.
      const activeReactions = new Map();
      messages
        .filter((m) => m.reactionTo === msg.id)
        .forEach((reaction) => {
          const key = `${reaction.sender}-${reaction.message}`;
          if (reaction.reactionRemoved) {
            activeReactions.delete(key);
          } else {
            activeReactions.set(key, reaction);
          }
        });
      const reactionGroups = {};
      activeReactions.forEach((reaction) => {
        (reactionGroups[reaction.message] ??= []).push(reaction.sender);
      });
      const originalMessage =
        msg.replyTo != null ? findById(msg.replyTo) : null;
      const senderColor = colorForSender(msg.sender);

      // Display the message with timestamp, sender, and message text. Show
      // truncated original message if it's a reply (with sender info) and any
      // reactions we found to the message.
      const msgDiv = document.createElement("div");
      msgDiv.className = "chat-replay-msg";
      msgDiv.setAttribute("data-id", msg.id);

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
    };

    // Newly revealed messages auto-scroll into view, like a live chat -
    // but only while the user is already near the bottom. If they've
    // scrolled up to read history, leave the view alone and show a "jump
    // to latest" pill instead of yanking them back down.
    const jumpToLatestButton = document.createElement("button");
    jumpToLatestButton.setAttribute("id", "chat-replay-jump-to-latest");
    jumpToLatestButton.type = "button";
    jumpToLatestButton.textContent = "↓ New messages";
    jumpToLatestButton.hidden = true;
    const isNearBottom = () =>
      messagesDiv.scrollHeight -
        messagesDiv.scrollTop -
        messagesDiv.clientHeight <
      40;
    let autoFollow = true;
    messagesDiv.addEventListener("scroll", () => {
      autoFollow = isNearBottom();
      jumpToLatestButton.hidden = autoFollow;
    });
    jumpToLatestButton.addEventListener("click", () => {
      autoFollow = true;
      jumpToLatestButton.hidden = true;
      messagesDiv.scrollTo({
        top: messagesDiv.scrollHeight,
        behavior: "smooth",
      });
    });

    // `pointer` tracks how far into `messages` we've rendered. Messages
    // only ever get added, never removed, so scrolling up to see history
    // is unaffected by how much of the transcript has been revealed yet.
    // `smooth` is false for bulk catch-ups (a reference-time edit, or the
    // no-playback-updates fallback) so a big backfill snaps into place
    // instead of visibly scrolling through everything in between.
    let pointer = 0;
    const catchUpTo = (currentSecond, { smooth = true } = {}) => {
      let renderedAny = false;
      while (pointer < messages.length) {
        const msg = messages[pointer];
        if (msg.reactionTo != null) {
          // Reactions are folded into their target's bubble above, never
          // rendered on their own; skip past them regardless of timestamp.
          pointer++;
          continue;
        }
        if (msg.offsetSeconds > currentSecond) {
          break;
        }
        renderMessage(msg);
        renderedAny = true;
        pointer++;
      }
      if (!renderedAny) {
        return;
      }
      applySearchFilter();
      if (autoFollow) {
        messagesDiv.scrollTo({
          top: messagesDiv.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      } else {
        jumpToLatestButton.hidden = false;
      }
    };

    let referenceSeconds =
      Math.floor((messages[0]?.totalSeconds ?? 0) / 600) * 600;
    const recomputeOffsets = () => {
      messages.forEach((msg) => {
        msg.offsetSeconds = msg.totalSeconds - referenceSeconds;
      });
    };
    recomputeOffsets();

    let lastKnownSecond = 0;
    const replayFromStart = () => {
      messagesDiv.replaceChildren();
      pointer = 0;
      catchUpTo(lastKnownSecond, { smooth: false });
    };

    const startTimeDiv = document.createElement("div");
    startTimeDiv.setAttribute("id", startTimeId);
    const startTimeLabel = document.createElement("label");
    startTimeLabel.textContent = "Video start: ";
    const startTimeInput = document.createElement("input");
    startTimeInput.type = "time";
    startTimeInput.step = "1";
    startTimeInput.value = secondsToTimeString(referenceSeconds);
    let startTimeChangeTimer;
    startTimeInput.addEventListener("change", () => {
      clearTimeout(startTimeChangeTimer);
      startTimeChangeTimer = setTimeout(() => {
        if (!startTimeInput.value) {
          return;
        }
        referenceSeconds = parseTimestampToSeconds(startTimeInput.value);
        recomputeOffsets();
        replayFromStart();
      }, 200);
    });
    startTimeLabel.append(startTimeInput);
    startTimeDiv.append(startTimeLabel);

    // `searchQuery` is tracked outside the input handler so both playback
    // (via `catchUpTo`, as new messages get revealed) and a start-time edit
    // (via `replayFromStart`, which rebuilds the DOM from scratch) can keep
    // the filter in sync with whatever the user last searched for, without
    // needing to re-type it.
    let searchQuery = "";
    const searchResultsSpan = document.createElement("span");

    // Hides every rendered message that doesn't match `searchQuery` instead
    // of just highlighting matches, so the list is actually scannable.
    // Only the initial search (typing, or a fresh set of matches after a
    // reference-time edit) scrolls to the first match - reapplying the
    // filter as more messages get revealed during playback must not keep
    // yanking the view back to it.
    const applySearchFilter = ({ scrollToFirst = false } = {}) => {
      const msgDivs = messagesDiv.querySelectorAll(".chat-replay-msg");
      if (!searchQuery) {
        msgDivs.forEach((msgDiv) => (msgDiv.hidden = false));
        searchResultsSpan.textContent = "";
        return;
      }
      // Reaction entries never get their own bubble, so they can never
      // match - exclude them from matching entirely.
      const matchingIds = new Set(
        messages
          .filter(
            (msg) =>
              msg.reactionTo == null &&
              (msg.message.toLowerCase().includes(searchQuery) ||
                msg.sender.toLowerCase().includes(searchQuery)),
          )
          .map((msg) => msg.id),
      );
      let firstMatch = null;
      let renderedMatchCount = 0;
      msgDivs.forEach((msgDiv) => {
        const msgId = Number(msgDiv.dataset.id);
        const isMatch = matchingIds.has(msgId);
        msgDiv.hidden = !isMatch;
        if (isMatch) {
          renderedMatchCount++;
          firstMatch ??= msgDiv;
        }
      });
      // `matchingIds` covers the whole transcript, but only messages
      // playback has already reached are actually rendered and hideable -
      // the gap between the two is matches still waiting later in the chat.
      const notYetShownCount = matchingIds.size - renderedMatchCount;
      if (renderedMatchCount > 0) {
        searchResultsSpan.textContent = `${renderedMatchCount} match${
          renderedMatchCount === 1 ? "" : "es"
        }`;
        if (notYetShownCount > 0) {
          searchResultsSpan.textContent += ` (+${notYetShownCount} more later)`;
        }
      } else if (matchingIds.size > 0) {
        // Matches exist, but only later in the transcript than playback
        // has reached so far - say so instead of looking broken.
        searchResultsSpan.textContent = `${matchingIds.size} match${
          matchingIds.size === 1 ? "" : "es"
        } later`;
      } else {
        searchResultsSpan.textContent = "No matches";
      }
      if (scrollToFirst && firstMatch) {
        firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    const searchMessageDiv = document.createElement("div");
    searchMessageDiv.setAttribute("id", "chat-replay-search-message");
    const searchMessageInput = document.createElement("input");
    searchMessageInput.type = "text";
    searchMessageInput.placeholder = "Search messages";
    let searchDebounceTimer;
    searchMessageInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = searchMessageInput.value.trim().toLowerCase();
        applySearchFilter({ scrollToFirst: true });
      }, 200);
    });
    searchMessageDiv.append(searchMessageInput);
    searchMessageDiv.append(searchResultsSpan);

    // Lets the user switch between the default synced-to-playback view and
    // seeing the whole transcript at once - useful both as a general
    // preference (skim everything, then watch) and as a manual fallback if
    // the player never broadcasts playback updates (e.g. it isn't
    // YouTube-backed), instead of guessing at a timeout for that.
    const showAllDiv = document.createElement("div");
    showAllDiv.setAttribute("id", "chat-replay-show-all");
    const showAllLabel = document.createElement("label");
    const showAllInput = document.createElement("input");
    showAllInput.type = "checkbox";
    showAllInput.addEventListener("change", () => {
      if (showAllInput.checked) {
        catchUpTo(Infinity, { smooth: false });
      } else {
        replayFromStart();
      }
    });
    showAllLabel.append(showAllInput, " Show all messages");
    showAllDiv.append(showAllLabel);

    const controlsDiv = document.createElement("div");
    controlsDiv.setAttribute("id", "chat-replay-controls");

    controlsDiv.append(startTimeDiv);
    controlsDiv.append(searchMessageDiv);
    controlsDiv.append(showAllDiv);

    chatReplayDiv.append(controlsDiv);
    chatReplayDiv.append(messagesDiv);
    chatReplayDiv.append(jumpToLatestButton);

    // The player broadcasts an `infoDelivery` message even before playback
    // starts, so the first one received also handles the case where the
    // bookmarklet is run mid-video. Messages only have second resolution,
    // so dedupe on the floored second rather than acting on every message.
    let lastCheckedSecond = -1;
    const handleMessage = (event) => {
      if (event.origin !== "https://youtube.googleapis.com") {
        return;
      }
      let data;
      try {
        data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (
        data?.event !== "infoDelivery" ||
        typeof data.info?.currentTime !== "number"
      ) {
        return;
      }
      const currentSecond = Math.floor(data.info.currentTime);
      lastKnownSecond = currentSecond;
      if (currentSecond === lastCheckedSecond) {
        return;
      }
      lastCheckedSecond = currentSecond;
      catchUpTo(currentSecond);
    };
    window.__chatReplayMessageListener = handleMessage;
    window.addEventListener("message", handleMessage);
  };

  injectStyles();
  createInputUI();
  const chatText = await getChatText();
  const messages = parseChatText(chatText);
  setupChatReplay(messages);
})();
