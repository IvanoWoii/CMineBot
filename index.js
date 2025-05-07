require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { status } = require("minecraft-server-util");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SERVER_ADDRESS = process.env.SERVER_ADDRESS;
const SERVER_PORT = parseInt(process.env.SERVER_PORT, 10); // biasanya 25565

const axios = require("axios");

let lastOnline = null;

async function sedwebhook(message) {
  const webhookURL = process.env.WEBHOOK_URL;
  if (!webhookURL) return;

  await axios.post(webhookURL, {
    content: message,
  });
}

client.once("ready", async () => {
  console.log(`Bot login sebagai ${client.user.tag}`);
  updateActivity(); // langsung update saat awal

  // Update setiap 5 menit (300.000 ms)
  setInterval(updateActivity, 5 * 60 * 1000);
});

async function updateActivity() {
  console.log("⏳ Mengupdate status bot...");
  try {
    const response = await status(SERVER_ADDRESS, SERVER_PORT);
    const playerCount = response.players.online;
    const maxPlayers = response.players.max;
    const playerNames = response.players.sample
      ? response.players.sample.map((p) => p.name).join(", ")
      : "Tidak ada pemain";

    const activityText = `🟢 ${playerCount}/${maxPlayers} pemain: ${playerNames}`;

    console.log(`✅ Server online: ${activityText}`);

    client.user.setPresence({
      activities: [
        {
          name: activityText,
          type: ActivityType.Watching,
        },
      ],
      status: "online",
    });

    if (lastOnline === false || lastOnline === null) {
      await sendWebhook(
        `✅ **Server online!** ${playerCount}/${maxPlayers} pemain aktif.\n👥 Pemain: ${playerNames}`
      );
    }

    lastOnline = true;
  } catch (error) {
    console.log("❌ Gagal menjangkau server. Server offline.");

    client.user.setPresence({
      activities: [
        {
          name: "🔴 Server OFFLINE",
          type: ActivityType.Watching,
        },
      ],
      status: "dnd",
    });

    if (lastOnline === true || lastOnline === null) {
      await sendWebhook("⚠️ **Server offline** atau tidak dapat dijangkau.");
    }

    lastOnline = false;
  }
}

client.on("messageCreate", async (message) => {
  if (message.content === "!status") {
    try {
      const response = await status(SERVER_ADDRESS, SERVER_PORT);
      message.channel.send(
        `✅ Server **ONLINE** dengan ${response.players.online}/${response.players.max} pemain.`
      );
    } catch (error) {
      message.channel.send("❌ Server **OFFLINE** atau tidak dapat dijangkau.");
    }
  }

  if (message.content === "!ip") {
    message.channel.send(
      `📡 IP Server Minecraft Aternos:\n**${SERVER_ADDRESS}:${SERVER_PORT}**`
    );
  }
});

client.login(DISCORD_TOKEN);
