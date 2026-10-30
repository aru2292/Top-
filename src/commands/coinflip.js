module.exports={name:"coinflip",aliases:["flip"],async execute({message}){return message.reply(`🪙 ${Math.random()<.5?"Heads":"Tails"}!`);}};
