const { SlashCommandBuilder, Collection } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailystats')
    .setDescription('Reports daily user statistics.'),
  async execute(interaction) {
    
    let messages = await fetchMore(interaction.channel);
    console.log(`Received ${messages.size} messages`);

    const d = new Date();
    const month = d.getMonth() < 9 ? `0${d.getMonth()+1}` : `${d.getMonth()+1}`;
    const today = `${d.getFullYear()}-${month}-${d.getDate()}`;

    messages = messages.filter(message => {
      let m = message.createdAt;
      let mMonth = m.getMonth() < 9 ? `0${m.getMonth()+1}` : `${m.getMonth()+1}`;
      let messageDate = `${m.getFullYear()}-${mMonth}-${m.getDate()}`;
      return messageDate == today;
    });
    console.log(`${messages.size} messages after filtering.`);

    // messages.forEach(message => console.log(message.content));
  },
};

async function fetchMore(channel, limit = 500) {
  if (!channel) {
    throw new Error(`Expected channel, got ${typeof channel}.`);
  }
  if (limit <= 100) {
    return channel.messages.fetch({ limit });
  }

  let collection = new Collection();
  let lastId = null;
  let options = {};
  let remaining = limit;

  while (remaining > 0) {
    options.limit = remaining > 100 ? 100 : remaining;
    remaining = remaining > 100 ? remaining - 100 : 0;

    if (lastId) {
      options.before = lastId;
    }

    let messages = await channel.messages.fetch(options);

    if (!messages.last()) {
      break;
    }

    collection = collection.concat(messages);
    lastId = messages.last().id;
  }

  return collection;
}

