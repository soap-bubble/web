import tmi from 'tmi.js';

export default async function init(logger, profileProvider, provideTwitchUserToken, twitchClientId) {
  const { twitchBotName } = await profileProvider();
  const defaultChannel = `#${twitchBotName}`;
  let client;
  // client.on("chat", function (channel, userstate, message, self) {
  //     // Don't listen to my own messages..
  //     if (self) return;
  //     logger.info(channel, message);
  //     client.say(channel, `I can say that too ${message}`)
  // });


  const api = {
    say(message) {
      client.say(defaultChannel, `MrDestructoid ${message} MrDestructoid`);
    },
    async connect() {
      const commandPrefix = "!";
      const tmiOptions = {
        options: {
          clientId: twitchClientId,
          debug: true,
        },
        connection: {
          reconnect: true,
        },
        identity: {
          username: twitchBotName,
          password: `oauth:${await provideTwitchUserToken()}`,
        },
        channels: [defaultChannel],
      };
      client = new tmi.client(tmiOptions);

      try {
        await client.connect();
      } catch (err) {
        logger.warn('Failed to connecto to twitch chat');
      }
    }
  };

  await api.connect();

  return api;
}
