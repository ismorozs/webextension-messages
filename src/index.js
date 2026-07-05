const browser = require("webextension-polyfill");

const STOP_ACTION = `WEBEXTENSION_MESSAGES_STOP_COMMUNICATION`;
const RESULT_PROMISES = {};
const ACTIONS = {};

browser.runtime.onMessage.addListener((message) => {
  if (message.action === STOP_ACTION) {
    stopCommunication(message.payload);
  }
});

function setupCommunication (actions, messagesId = generateId()) {
  const messages = Object.fromEntries(
    Object.entries(actions).map(([action]) => [
      action,
      (payload) => sendMessageForResult(action, payload),
    ]),
  );

  ACTIONS[messagesId] = (message) => onMessage(message, actions);

  browser.runtime.onMessage.addListener(ACTIONS[messagesId]);

  return {
    ...messages,
    stopCommunication: () => stopCommunication(messagesId, true),
  };
}

async function onMessage (message, actions = {}) {
  if (RESULT_PROMISES[message.resultId]) {
    RESULT_PROMISES[message.resultId](message.payload);
    delete RESULT_PROMISES[message.resultId];
    return;
  }

  if (actions[message.action]) {
    const payload = await actions[message.action](message.payload);
    sendMessage(message.action, payload, message.resultId);
  }
}

function sendMessageForResult (action, payload) {
  const { resultId, promise } = createResultPromise();
  sendMessage(action, payload, resultId);
  return promise;
}

function sendMessage (action, payload, resultId) {
  const message = { action, payload, resultId };

  if (isBackgroundScript()) {
    getCurrentTab().then((tab) => browser.tabs.sendMessage(tab[0].id, message));
  } else {
    browser.runtime.sendMessage(message);
  }
}

function createResultPromise () {
  const resultId = generateId();

  return {
    promise: new Promise((res) => (RESULT_PROMISES[resultId] = res)),
    resultId,
  };
}

function isBackgroundScript () {
  return (
    window.location.protocol === "chrome-extension:" ||
    window.location.protocol === "moz-extension:"
  );
}

function generateId () {
  return `${Date.now()}-${Math.random()}`;
}

function getCurrentTab () {
  return browser.tabs.query({ active: true, currentWindow: true });
}

function stopCommunication (messagesId, sendToReceiver) {
  browser.runtime.onMessage.removeListener(ACTIONS[messagesId]);
  delete ACTIONS[messagesId];

  if (sendToReceiver) {
    sendMessage(STOP_ACTION, messagesId);
  }
}

module.exports = {
  setup: setupCommunication,
};
