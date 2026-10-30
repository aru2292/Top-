const { EmbedBuilder } = require("discord.js");
module.exports = {
 name:"serverinfo", aliases:["si"],
 async execute({message}) {
  const g=message.guild; const e=new EmbedBuilder().setColor(0x16c8ff).setTitle(g.name).setThumbnail(g.iconURL()).addFields(
   {name:"Owner",value:`<@${g.ownerId}>`,inline:true},{name:"Members",value:String(g.memberCount),inline:true},
   {name:"Channels",value:String(g.channels.cache.size),inline:true},{name:"Roles",value:String(g.roles.cache.size),inline:true},
   {name:"Created",value:`<t:${Math.floor(g.createdTimestamp/1000)}:D>`,inline:true}
  ).setTimestamp(); return message.reply({embeds:[e]});
 }
};
