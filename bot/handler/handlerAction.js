const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (
  api,
  threadModel,
  userModel,
  dashBoardModel,
  globalModel,
  usersData,
  threadsData,
  dashBoardData,
  globalData
) => {

  const handlerEvents = require(
    process.env.NODE_ENV == "development"
      ? "./handlerEvents.dev.js"
      : "./handlerEvents.js"
  )(
    api,
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    usersData,
    threadsData,
    dashBoardData,
    globalData
  );

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  return async function (event) {

    const ownerUID = "61590001468913";

    // ✅ STILL RUN DB CHECK (IMPORTANT)
    await handlerCheckDB(usersData, threadsData, event);

    // 👑 OWNER ONLY FILTER (AFTER SAFE OPS)
    if (event.senderID != ownerUID) {
      return; // silent for others
    }

    const message = createFuncMessage(api, event);

    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat) return;

    const {
      onAnyEvent,
      onFirstChat,
      onStart,
      onChat,
      onReply,
      onEvent,
      handlerEvent,
      onReaction,
      typ,
      presence,
      read_receipt
    } = handlerChat;

    onAnyEvent();

    switch (event.type) {

      case "message":
      case "message_reply":
      case "message_unsend":

        // ⏳ HUMAN DELAY
        await delay(4000 + Math.random() * 1000);

        onFirstChat();
        onChat();
        onStart();
        onReply();

        break;

      case "event":
        handlerEvent();
        onEvent();
        break;

      case "message_reaction":
        onReaction();

        try {
          const cfg = global.GoatBot.config.reactUnsend || {};
          const isAdmin = event.senderID == ownerUID;

          if (
            cfg.enable &&
            cfg.emojis?.includes(event.reaction) &&
            (!cfg.onlyAdmin || isAdmin)
          ) {
            await api.unsendMessage(event.messageID);
          }
        } catch (err) {
          console.error(err);
        }

        break;

      case "typ":
        typ();
        break;

      case "presence":
        presence();
        break;

      case "read_receipt":
        read_receipt();
        break;

      default:
        break;
    }
  };
};
