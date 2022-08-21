const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailystats')
    .setDescription('Reports daily user statistics.'),
  async execute(interaction) {
    let messages = interaction.channel.messages;

    messages.fetch({ limit: 100 }).then(messages => {
      console.log(`Received ${messages.size} messages`);
      const d = new Date();
      const today =  `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      messages = messages.filter(message => {
        let m = message.createdAt;
        let messageDate = `${m.getFullYear()}-${m.getMonth()+1}-${m.getDate()}`;
        return messageDate == today;
      });
      console.log(messages.size);
      // let count = 0;
      messages.forEach(message => console.log(message.content));
    })
  },
};


