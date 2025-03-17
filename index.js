//index.js
require("dotenv/config");
const { IntentsBitField, Client } = require("discord.js");
const handleUserActivity = require('./database/HandleUserActivity.js');
const { CommandHandler } = require("djs-commander");
const keep_alive = require("./keep_alive.js");
const path = require("path");

const client = new Client({
  intents: [ //Don't change intentsBitField
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
  ],
});

new CommandHandler({
  client,
  commandsPath: path.join(__dirname, "commands"),
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});



handleUserActivity(client);

keep_alive();
client.login(process.env.DISCORD_TOKEN);