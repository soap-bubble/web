import Discord from 'discord.js';
import factory from './factory';

export default function (config, twitchChat) {
  const {
    token,
  } = config.discord;
  const client = new Discord.Client();


  const pingPong = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content === 'ping';
    },
    action(message) {
      message.reply('pong');
    },
  };

  const getChannel = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content === 'channel';
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const channel = await twitchApi.getChannel();
        message.reply(JSON.stringify(channel, null, 2));
      });
    }
  }

  const editStatus = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content.indexOf('edit status ') === 0;
    },
    action(message) {
      const status = message.content.split('edit status ')[1];
      factory(async function channelAction(twitchApi) {
        await twitchApi.setChannel({
          status,
        });
        message.reply('done');
        twitchChat.say(`Setting status to "${status}"`);
      });
    }
  }

  const editGame = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content.indexOf('edit game ') === 0;
    },
    action(message) {
      const game = message.content.split('edit game ')[1];
      factory(async function channelAction(twitchApi) {
        await twitchApi.setChannel({
          game,
        });
        message.reply('done');
        twitchChat.say(`Setting game to [${game}]`);
      });
    }
  }


  function handleMessage(message, cb) {
    [
      pingPong,
      getChannel,
      editStatus,
      editGame,
    ].forEach(({ selector, action }) => {
      if (selector(message)) {
        action(message);
      }
    });
  }

  client.on('ready', () => {
    console.log('I am ready!');
  });

  client.login(token);

  client.on('message', handleMessage);

  const selfie = {
    client,
    on: client.on.bind(client),
    off: client.removeListener.bind(client),
    letsPlay(message) {
      client.guilds.forEach((guild) => {
        const channel = guild.channels.find('name', 'letsplay');
        channel.send(message);
      });
    },
  };

  return selfie;
}
