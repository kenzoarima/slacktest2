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

// Respond to direct messages
app.message(async ({ message, say }) => {
  await say(randomGreeting());
});

// Respond to @mentions in channels
app.event('app_mention', async ({ event, say }) => {
  await say(randomGreeting());
});

(async () => {
  await app.start(3000);
  console.log('⚡ Greeter Bot is running on port 3000!');
})();
