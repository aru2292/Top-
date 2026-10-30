require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("Set DISCORD_TOKEN and CLIENT_ID before running npm run register.");
  process.exit(1);
}
const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Show TOP command guide"),
  new SlashCommandBuilder().setName("ping").setDescription("Check TOP latency"),
  new SlashCommandBuilder().setName("play").setDescription("Play music").addStringOption(o => o.setName("query").setDescription("Song name or URL").setRequired(true)),
  new SlashCommandBuilder().setName("skip").setDescription("Skip the current track"),
  new SlashCommandBuilder().setName("stop").setDescription("Stop music and leave voice"),
  new SlashCommandBuilder().setName("queue").setDescription("Show the music queue")
].map(c => c.toJSON());
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);
    await rest.put(route, { body: commands });
    console.log(`Registered ${commands.length} slash commands.`);
  } catch (e) { console.error("Slash command registration failed:", e); process.exitCode = 1; }
})();
