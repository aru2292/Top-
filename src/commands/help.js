const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "help", aliases: ["h", "commands"],
  async execute({ message, guildData }) {
    const e = new EmbedBuilder().setColor(0x16c8ff).setAuthor({ name: "TOP • All-in-One Discord Bot" })
      .setTitle("Command Center")
      .setDescription(`Prefix: \`${guildData.prefix}\`\nUse slash commands where available. Commands requiring permissions are marked **[MOD]**.`)
      .addFields(
        { name: "🛡️ Security", value: "`antinuke on/off` `antinuke threshold <1-10>` `whitelist add/remove @user` `automod on/off`", inline: false },
        { name: "🔨 Moderation", value: "`ban @user [reason]` `kick @user [reason]` `timeout @user <minutes>` `clear <1-100>` `warn @user <reason>` `warnings @user` `lock` `unlock` `slowmode <seconds>`", inline: false },
        { name: "🎵 Music", value: "`play <song/url>` `skip` `stop` `pause` `resume` `queue` `volume <1-100>`", inline: false },
        { name: "⚙️ Server", value: "`setlog #channel` `setwelcome #channel` `serverinfo` `userinfo [@user]` `avatar [@user]`", inline: false },
        { name: "🎫 Community", value: "`ticket` `poll <question>` `giveaway <minutes> <prize>` `8ball <question>` `coinflip` `say <text>`", inline: false }
      ).setFooter({ text: "TOP • Configure permissions and roles safely" }).setTimestamp();
    return message.reply({ embeds: [e] });
  },
  async slash({ interaction }) {
    const e = new EmbedBuilder().setColor(0x16c8ff).setTitle("TOP • Command Center")
      .setDescription("**Security:** ` .antinuke on `, `.whitelist add @user`, `.automod on`\n**Moderation:** `.ban`, `.kick`, `.timeout`, `.clear`, `.warn`, `.lock`\n**Music:** `/play`, `/skip`, `/stop`, `/queue` or prefix music commands\n**Server:** `.setlog`, `.setwelcome`, `.serverinfo`, `.userinfo`\n**Community:** `.ticket`, `.poll`, `.giveaway`, `.8ball`, `.coinflip`")
      .setFooter({ text: "Prefix: . • TOP" });
    return interaction.reply({ embeds: [e], ephemeral: true });
  }
};
