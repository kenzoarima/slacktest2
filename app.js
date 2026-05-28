require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const greetings = [
  "Hey there! 👋",
  "Hello, sunshine! ☀️",
  "Yo! What's up? 🤙",
  "Greetings, human! 🤖",
  "Ahoy! ⚓",
  "Well, hello there! 😄",
  "Howdy, partner! 🤠",
  "Salutations! 🎩",
];

function randomGreeting() {
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractMessage(text, botUserId) {
  // Remove the @mention (e.g. <@U12345>) from the message and trim whitespace
  return text.replace(`<@${botUserId}>`, '').trim();
}

// Respond to direct messages
app.message(async ({ message, say }) => {
  await say(randomGreeting());
});

// Respond to @mentions in channels
app.event('app_mention', async ({ event, say, client, ack }) => {
  // Acknowledge immediately (Bolt does this automatically, but being explicit is safer)
  const botInfo = await client.auth.test();
  const userMessage = extractMessage(event.text, botInfo.user_id);

  // Fire and forget — don't await the delay inside the handler
  (async () => {
    await delay(31000);
    await say(`${userMessage} back at you!`);
  })();
});

(async () => {
  await app.start(3000);
  console.log('⚡ Greeter Bot is running on port 3000!');
})();
