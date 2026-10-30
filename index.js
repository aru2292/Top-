require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Partials, Collection, Events, ActivityType, EmbedBuilder, AuditLogEvent, PermissionsBitField, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");

const token = process.env.DISCORD_TOKEN;
if (!token || token.includes("PASTE_")) {
  console.error("Missing DISCORD_TOKEN. Copy .env.example to .env locally, or set DISCORD_TOKEN in Railway Variables.");
  process.exit(1);
}

const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, "top-data.json");
let db = { guilds: {}, users: {} };
try { if (fs.existsSync(dbFile)) db = { ...db, ...JSON.parse(fs.readFileSync(dbFile, "utf8")) }; }
catch (e) { console.error("Database file could not be read; starting with a fresh database:", e.message); }

let saveTimer;
function saveDB() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const tmp = dbFile + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
      fs.renameSync(tmp, dbFile);
    } catch (e) { console.error("Database save failed:", e.message); }
  }, 250);
}
function guildData(id) {
  if (!db.guilds[id]) db.guilds[id] = {
    prefix: process.env.PREFIX || ".",
    logChannel: null, welcomeChannel: null,
    antinuke: { enabled: process.env.ANTINUKE_DEFAULT_ENABLED === "true", threshold: Number(process.env.ANTINUKE_DEFAULT_THRESHOLD || 3), window: Number(process.env.ANTINUKE_WINDOW_SECONDS || 10), whitelist: [] },
    warnings: {}, automod: { enabled: true, inviteBlock: false, mentionLimit: 8 },
    tickets: {}, giveaways: {}
  };
  return db.guilds[id];
}
const owners = (process.env.OWNER_IDS || "").split(",").map(x => x.trim()).filter(Boolean);
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildInvites],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User]
});
client.commands = new Collection();
client.db = db;
client.guildData = guildData;
client.saveDB = saveDB;
client.owners = owners;
client.player = new Player(client, { ytdlOptions: { quality: "highestaudio", highWaterMark: 1 << 25 } });

(async () => {
  try { await client.player.extractors.loadMulti(DefaultExtractors); }
  catch (e) { console.warn("Music extractors did not all load:", e.message); }
})();

for (const file of fs.readdirSync(path.join(__dirname, "src", "commands")).filter(f => f.endsWith(".js"))) {
  const command = require(path.join(__dirname, "src", "commands", file));
  client.commands.set(command.name, command);
  for (const alias of command.aliases || []) client.commands.set(alias, command);
}

function isOwner(id) { return owners.includes(id); }
function hasMod(member) {
  return member?.permissions?.has(PermissionsBitField.Flags.ManageGuild) || isOwner(member?.id);
}
async function sendLog(guild, text) {
  const channelId = guildData(guild.id).logChannel;
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (channel?.isTextBased()) channel.send({ content: text.slice(0, 1900) }).catch(() => {});
}
client.sendLog = sendLog;

client.once(Events.ClientReady, async c => {
  console.log(`TOP is online as ${c.user.tag}`);
  c.user.setPresence({ activities: [{ name: "TOP • /help", type: ActivityType.Watching }], status: "online" });
  // Register the included slash commands automatically on startup.
  try {
    const slashCommands = [
      new SlashCommandBuilder().setName("help").setDescription("Show TOP command guide"),
      new SlashCommandBuilder().setName("ping").setDescription("Check TOP latency"),
      new SlashCommandBuilder().setName("play").setDescription("Play music").addStringOption(o => o.setName("query").setDescription("Song name or URL").setRequired(true)),
      new SlashCommandBuilder().setName("skip").setDescription("Skip the current track"),
      new SlashCommandBuilder().setName("stop").setDescription("Stop music and leave voice"),
      new SlashCommandBuilder().setName("queue").setDescription("Show the music queue")
    ].map(command => command.toJSON());
    const rest = new REST({ version: "10" }).setToken(token);
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(c.user.id, process.env.GUILD_ID)
      : Routes.applicationCommands(c.user.id);
    await rest.put(route, { body: slashCommands });
    console.log(`Registered ${slashCommands.length} slash commands.`);
  } catch (e) {
    console.error("Slash command auto-registration failed:", e.message);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  const gd = guildData(message.guild.id);
  if (gd.automod?.enabled && !hasMod(message.member)) {
    const invite = /(discord\.gg\/|discord\.com\/invite\/)/i.test(message.content);
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if ((gd.automod.inviteBlock && invite) || mentions > Number(gd.automod.mentionLimit || 8)) {
      await message.delete().catch(() => {});
      const warn = await message.channel.send(`${message.author}, your message was removed by TOP AutoMod.`).catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);
      await sendLog(message.guild, `🛡️ AutoMod removed a message from ${message.author.tag} in ${message.channel}.`);
      return;
    }
  }
  const prefix = gd.prefix || ".";
  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const name = (args.shift() || "").toLowerCase();
  const command = client.commands.get(name);
  if (!command) return;
  try { await command.execute({ client, message, args, guildData: gd, hasMod, isOwner }); }
  catch (e) { console.error(`Command ${name} failed:`, e); message.reply("❌ Something went wrong while running that command. Check the bot logs.").catch(() => {}); }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.slash) return interaction.reply({ content: "This slash command is not available yet. Use the prefix command or `/help`.", ephemeral: true });
    try { await command.slash({ client, interaction, guildData: guildData(interaction.guildId), hasMod, isOwner }); }
    catch (e) { console.error(e); const payload = { content: "❌ Command failed. Check bot logs.", ephemeral: true }; if (interaction.deferred || interaction.replied) interaction.followUp(payload).catch(() => {}); else interaction.reply(payload).catch(() => {}); }
  }
  if (interaction.isButton() && interaction.customId.startsWith("top_ticket:")) {
    const [, action] = interaction.customId.split(":");
    if (action === "create") {
      const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
      if (existing) return interaction.reply({ content: `You already have a ticket: ${existing}`, ephemeral: true });
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`.slice(0, 90),
        type: 0,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
        ]
      });
      await channel.send({ content: `${interaction.user} opened a support ticket. Staff can assist here.`, components: [{ type: 1, components: [{ type: 2, style: 4, label: "Close ticket", custom_id: "top_ticket:close" }] }] });
      return interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    }
    if (action === "close") {
      if (!hasMod(interaction.member) && !interaction.channel.name.startsWith(`ticket-${interaction.user.id}`)) return interaction.reply({ content: "You cannot close this ticket.", ephemeral: true });
      await interaction.reply("🔒 Closing ticket in 5 seconds...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

const destructive = new Set([AuditLogEvent.ChannelDelete, AuditLogEvent.RoleDelete, AuditLogEvent.MemberBanAdd, AuditLogEvent.MemberKick, AuditLogEvent.WebhookCreate, AuditLogEvent.BotAdd]);
const recentActions = new Map();
client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
  const gd = guildData(guild.id);
  if (!gd.antinuke?.enabled || !destructive.has(entry.action) || !entry.executorId || entry.executorId === client.user.id) return;
  if (gd.antinuke.whitelist.includes(entry.executorId) || isOwner(entry.executorId)) return;
  const key = `${guild.id}:${entry.executorId}:${entry.action}`;
  const now = Date.now();
  const windowMs = Number(gd.antinuke.window || 10) * 1000;
  const list = (recentActions.get(key) || []).filter(t => now - t < windowMs);
  list.push(now); recentActions.set(key, list);
  await sendLog(guild, `🚨 **TOP Anti-Nuke Alert**\nExecutor: <@${entry.executorId}>\nAction: \`${entry.action}\`\nCount: ${list.length}/${gd.antinuke.threshold}`);
  if (list.length >= Number(gd.antinuke.threshold || 3)) {
    const member = await guild.members.fetch(entry.executorId).catch(() => null);
    if (member?.bannable) await member.ban({ reason: "TOP Anti-Nuke: destructive action threshold exceeded." }).catch(err => console.warn("Anti-nuke could not ban executor:", err.message));
    else if (member?.kickable) await member.kick("TOP Anti-Nuke: destructive action threshold exceeded.").catch(() => {});
    list.length = 0;
    recentActions.set(key, list);
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const gd = guildData(member.guild.id);
  if (gd.welcomeChannel) {
    const ch = member.guild.channels.cache.get(gd.welcomeChannel);
    if (ch?.isTextBased()) ch.send({ embeds: [new EmbedBuilder().setColor(0x18c8ff).setTitle("Welcome to the server!").setDescription(`Welcome ${member} to **${member.guild.name}**!`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()] }).catch(() => {});
  }
});

client.on(Events.GuildMemberRemove, member => sendLog(member.guild, `👋 ${member.user.tag} left the server.`));
client.on(Events.GuildBanAdd, ban => sendLog(ban.guild, `🔨 ${ban.user.tag} was banned.`));
client.on(Events.GuildBanRemove, ban => sendLog(ban.guild, `♻️ ${ban.user.tag} was unbanned.`));

process.on("unhandledRejection", e => console.error("Unhandled rejection:", e));
process.on("uncaughtException", e => { console.error("Uncaught exception:", e); });

client.login(token);
