const { useMainPlayer, useQueue } = require("discord-player");
module.exports = {
 name:"play", aliases:["p"],
 async execute({message,args}) {
  const query=args.join(" "); if(!query)return message.reply("Usage: `.play <song name or URL>`");
  const vc=message.member.voice.channel;if(!vc)return message.reply("Join a voice channel first.");
  await message.channel.sendTyping();
  try { const player=useMainPlayer(); const result=await player.play(vc,query,{nodeOptions:{metadata:message.channel,leaveOnEmpty:true,leaveOnEmptyCooldown:60000,leaveOnEnd:true,leaveOnEndCooldown:15000,skipOnNoStream:true}});
   return message.reply(`🎶 Added **${result.track.title}** to the queue.`);
  } catch(e){console.error("Music play:",e);return message.reply("Music could not start. Check extractor/source availability and bot Connect/Speak permissions.");}
 },
 async slash({interaction}) {
  const query=interaction.options.getString("query",true);const vc=interaction.member.voice.channel;if(!vc)return interaction.reply({content:"Join a voice channel first.",ephemeral:true});
  await interaction.deferReply();try{const result=await useMainPlayer().play(vc,query,{nodeOptions:{metadata:interaction.channel,leaveOnEmpty:true,leaveOnEnd:true,skipOnNoStream:true}});return interaction.editReply(`🎶 Added **${result.track.title}** to the queue.`);}catch(e){console.error(e);return interaction.editReply("Music could not start. Check source availability and bot permissions.");}
 }
};
