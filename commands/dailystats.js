const { SlashCommandBuilder, Collection, GuildMember } = require('discord.js');

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


    // tracking number of messages sent by user today

    // populating map with all channel members
    let memberMessages = new Map();
    for (let member of interaction.channel.members.values()) {
      memberMessages.set(member.displayName, 0);
    }

    // updating # of messages per member
    messages.forEach(message => {
      let author = message.member.displayName;
      if (!memberMessages.has(author)) {
        memberMessages.set(author, 0);
      } else {
        let x = memberMessages.get(author) + 1;
        memberMessages.set(author, x);
      }
    });

    // output activity by member
    for (let member of memberMessages.keys()) {
      console.log(`${member}: ${memberMessages.get(member)} messages today`);
    }

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

