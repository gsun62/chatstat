const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('date')
    .setDescription('Reports the current date.'),
  async execute(interaction) {
    const d = new Date();
    const date = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    await interaction.reply(date);
  },
};


