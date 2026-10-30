const { EmbedBuilder, PermissionsBitField } = require("discord.js");
module.exports = {
 name: "ping", aliases: [],
 async execute({message, client}) { return message.reply(`🏓 Pong! API: ${Math.round(client.ws.ping)}ms`); },
 async slash({interaction, client}) { return interaction.reply({content:`🏓 Pong! API: ${Math.round(client.ws.ping)}ms`, ephemeral:true}); }
};
