require('dotenv').config();
const https = require('https');
const { URL } = require('url');
const { App } = require('@slack/bolt');

const mcpUrl = 'https://mcp.newrelic.com/mcp/';
const NEW_RELIC_MCP_RPC_METHOD = "tools/call"; //process.env.NEW_RELIC_MCP_RPC_METHOD || 'processInput';
const NEW_RELIC_USER_KEY = process.env.NEW_RELIC_USER_KEY;
var NEW_RELIC_ACCOUNT_ID = process.env.NEW_RELIC_ACCOUNT_ID;

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

async function callNewRelicMcpServer(input) {
  if (!mcpUrl) {
    throw new Error('NEW_RELIC_MCP_URL is not configured');
  }

  if (!NEW_RELIC_USER_KEY) {
    throw new Error('NEW_RELIC_USER_KEY is not configured');
  }

  if (input === null || input === undefined) {
    throw new Error('Input must not be null or undefined');
  }

  if (input.userMessage === null || typeof input.userMessage !== 'string') {
    throw new Error('Input must be a non-null string');
  }

  console.log('Calling New Relic MCP with input:', input.userMessage);

  const augInput = {
    "name": "natural_language_to_nrql_query",
    "arguments": {
      "user_request": input.userMessage,
      "account_id": NEW_RELIC_ACCOUNT_ID,
    },
  };

  const rpcId = `${Date.now()}`;
  const rpcPayload = {
    "jsonrpc": "2.0",
    "id": rpcId,
    "method": NEW_RELIC_MCP_RPC_METHOD,
    "params": augInput,
  };

  console.log('RPC Payload:', JSON.stringify(rpcPayload, null, 2));

  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'api-key': NEW_RELIC_USER_KEY,
    },
    body: JSON.stringify(rpcPayload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`MCP server responded ${response.status}: ${responseText}`);
  }

  try {
    return responseText ? JSON.parse(responseText) : {};
  } catch (err) {
    throw new Error(`Failed to parse MCP response: ${err.message}`);
  }
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
app.event('app_mention', async ({ event, say, client }) => {
  const botInfo = await client.auth.test();
  const userMessage = extractMessage(event.text, botInfo.user_id);

  // Fire and forget — don't await the delay inside the handler
  (async () => {
    try {
      const mcpResult = await callNewRelicMcpServer({ userMessage });
      //console.log('New Relic MCP response:', JSON.stringify(mcpResult, null, 2));
      console.log('New Relic MCP response:', JSON.stringify(mcpResult.result.structuredContent.result));
      mcpReplyMessage = mcpResult.result.structuredContent.result;
      await say(mcpReplyMessage);
    } catch (error) {
      console.error('Failed to call New Relic MCP:', error);
      await say(`${userMessage} back at you!`);
    }
    //await delay(31000);
  })();
});

(async () => {
  await app.start(3000);
  console.log('⚡ Greeter Bot is running on port 3000!');
})();
