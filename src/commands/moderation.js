const { PermissionsBitField } = require("discord.js");
module.exports = {
 name:"ban", aliases:[],
 async execute({message,args,hasMod}) {
  if(!hasMod(message.member)) return message.reply("❌ You need Manage Server permission.");
  const user=message.mentions.members.first(); if(!user) return message.reply("Usage: `.ban @user [reason]`");
  if(!user.bannable) return message.reply("I cannot ban that member. Check my role position and permissions.");
  await user.ban({reason:args.slice(1).join(" ")||`Requested by ${message.author.tag}`});
  return message.reply(`🔨 Banned **${user.user.tag}**.`);
 }
};
