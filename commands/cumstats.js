const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cumstats')
    .setDescription('Desplays a cumulative leaderboard of user stats'),
  async execute(interaction) {
    return interaction.reply('Pong!');
  },
};
