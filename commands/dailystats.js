const { SlashCommandBuilder, Collection, GuildMember } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailystats')
    .setDescription('Reports daily user statistics.'),
  async execute(interaction) {
    
    let messages = await fetchMore(interaction.channel);
    console.log(`Received ${messages.size} messages`);

    // filter to obtain today's messages
    const d = new Date();
    messages = messages.filter(message => 
      message.createdAt.toLocaleDateString() == d.toLocaleDateString());
    console.log(`${messages.size} messages after filtering.\n`);

    // summary
    console.log(userReport(interaction, messages));
    console.log(`Average message length: ${avgLength(messages)} characters\n`);
    console.log(mostLeastActiveHours(messages));
  },
};


// REPORTING MESSAGES SENT BY USER
function userReport(interaction, messages) {

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
  let report = '';
  for (let member of memberMessages.keys()) {
    report += `${member}: ${memberMessages.get(member)} messages today\n`;
  }
  return report;
}


// REPORTING AVG MESSAGE LENGTH
function avgLength(messages) {
  let sum = 0;
  messages.forEach(message => sum += message.content.length);
  return sum / messages.size;
}

// REPORTING MOST & LEAST ACTIVE 1 HOUR PERIOD, sliding window
function mostLeastActiveHours(messages) {
  
  // create map for every minute of the day
  let minutes = new Map();
  for (let x = 0; x < 24*60; x++) {
    minutes.set(x, 0);
  }

  // populate map with minutes that messages were sent & num of messages
  messages.forEach(message => {
    let minute = message.createdAt.getHours()*60 + message.createdAt.getMinutes();
    let x = minutes.get(minute) + 1;
    minutes.set(minute, x);
  });

  // initial max & min sums
  let maxStart = 0;
  let minStart = 0;
  let maxSum = 0;
  for (let i = 0; i < 60; i++) {
    maxSum += minutes.get(i);
  }
  let minSum = maxSum;

  // sliding window
  for (let i = 1; i < 23 * 60; i++) {
    let sum = maxSum - minutes.get(i-1) + minutes.get(i+59);
    if (sum > maxSum) {
      maxSum = sum;
      maxStart = i;
    }
    if (sum < minSum) {
      minSum = sum;
      minStart = i;
    }
  }

  let maxPeriod = `${minutesToHours(maxStart)} to ${minutesToHours(maxStart + 60)}`;
  let minPeriod = `${minutesToHours(minStart)} to ${minutesToHours(minStart + 60)}`;
  return `Most active period: ${maxPeriod}\nLeast active period: ${minPeriod}`; 
}

// utility function to convert minutes from midnight to hour:min time
function minutesToHours(minutes) {
  let hour = Math.floor(minutes / 60);
  hour = hour < 10 ? `0${hour}`: hour;
  let minute = minutes % 60;
  minute = minute < 10 ? `0${minute}`: minute;
  return `${hour}:${minute}`;
}

// utility function to fetch more messages in a text channel
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

