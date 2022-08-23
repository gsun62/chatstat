const { SlashCommandBuilder, Collection, GuildMember } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailystats')
    .setDescription('Reports daily user statistics.'),
  async execute(interaction) {
    
    let messages = await fetchMore(interaction.channel);
    console.log(`Received ${messages.size} messages`);

    const d = new Date();
    // const month = d.getMonth() < 9 ? `0${d.getMonth()+1}` : `${d.getMonth()+1}`;
    // const today = `${d.getFullYear()}-${month}-${d.getDate()}`;

    messages = messages.filter(message => 
      message.createdAt.toLocaleDateString() == d.toLocaleDateString());

    console.log(`${messages.size} messages after filtering.`);


    // REPORTING MESSAGES SENT BY USER

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

    // REPORTING AVG MESSAGE LENGTH
    let sum = 0;
    messages.forEach(message => sum += message.content.length);
    console.log(`Average message length: ${sum/messages.size} characters`);

    // REPORTING MOST ACTIVE 1 HOUR PERIOD, sliding window
    let start = 0;
    let end = 0;
    let min = 0;
    let max = 0;

    let minutes = new Map();

    // populate map with minutes that messages were sent & num of messages
    messages.forEach(message => {
      let minute = message.createdAt.getHours()*60 + message.createdAt.getMinutes();
      if (!messages.has(minute)) {
        messages.set(minute, 1);
      } else {
        let x = messages.get(minute) + 1;
        messages.set(author, x);
      }
    });

    // for each minute, check 60 minute interval starting there and record num of messages
    let maxSum = 0;
    minutes.forEach(minute => {
      let x = minute;
      let sum = 0;
      while (x <= minute + 60) {
        if minutes.has(x) {
          sum += minutes.get(x);
        }
      }
      maxSum = (sum > maxSum) ? sum : maxSum;
    });
    
    while (start <= 23*60) {


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

