const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('date')
    .setDescription('Reports the current date.'),
  async execute(interaction) {
    const d = new Date();
    const year = `${d.getFullYear()}`;
    const month = d.getMonth() < 9 ? `0${d.getMonth()+1}` : `${d.getMonth()+1}`;
    const day = `${d.getDate()}`;
    const date = `${year}-${month}-${day}`;
    await interaction.reply(date);
  },
};


