const { SlashCommandBuilder, Collection, EmbedBuilder, Embed} = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dailystats')
    .setDescription('Reports daily user statistics.'),
  async execute(interaction) {
    
    await interaction.deferReply();
		await wait(4000);

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
    console.log(mostLeastActivePeriods(messages, 2));

    const reportEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Daily Stats')
      .setURL('https://discord.js.org/')
      .setAuthor({ name: 'ChatStat', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
      .setDescription('A report of daily statistics for this channel.')
      .addFields(
        { name: 'Total Messages Today', value: `${messages.size}`},
        { name: 'User Activity', value: `${userReport(interaction, messages)}`},
        { name: 'Average Message Length', value: `${avgLength(messages)} characters`},
        { name: 'Most and Least Active Hours', value: `${mostLeastActivePeriods(messages, 30)}`},
      )
      .setTimestamp()
      .setFooter({ text: 'GUH!', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
    
    // await interaction.editReply('feet');
    await interaction.editReply({ embeds: [reportEmbed] });
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
    if (!message.member)
      return;
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
  return (sum / messages.size + 0.005).toFixed(2);
}

// REPORTING MOST & LEAST ACTIVE PERIOD, sliding window
function mostLeastActivePeriods(messages, width) {
  
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

  for (let i = 0; i < width; i++) {
    maxSum += minutes.get(i);
  }
  let sum = maxSum;
  let minSum = maxSum;

  // sliding window
  for (let i = 1; i < 23 * 60; i++) {
    sum = sum - minutes.get(i-1) + minutes.get(i+width-1);
    if (sum > maxSum) {
      maxSum = sum;
      maxStart = i;
    }
    if (sum < minSum) {
      minSum = sum;
      minStart = i;
    }
  }

  let maxPeriod = `${minutesToHours(maxStart)} to ${minutesToHours(maxStart + width)}, with ${maxSum} messages sent`;
  let minPeriod = `${minutesToHours(minStart)} to ${minutesToHours(minStart + width)}, with ${minSum} messages sent`;
  return `Most active ${width}-minute period: ${maxPeriod}\nLeast active ${width}-minute period: ${minPeriod}`; 
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
async function fetchMore(channel, limit = 1000) {
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

