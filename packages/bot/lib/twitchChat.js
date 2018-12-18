import tmi from 'tmi.js';

export default async function init(logger, profile, promiseTwitchUserToken, twitchClientId) {
  const { twitchBotName } = profile;
  const commandPrefix = "!";
  const defaultChannel = `#${twitchBotName}`;
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
      password: `oauth:${await promiseTwitchUserToken()}`,
    },
    channels: [defaultChannel],
  };
  const client = new tmi.client(tmiOptions);

  // client.on("chat", function (channel, userstate, message, self) {
  //     // Don't listen to my own messages..
  //     if (self) return;
  //     logger.info(channel, message);
  //     client.say(channel, `I can say that too ${message}`)
  // });


  client.connect();

  const api = {
    say(message) {
      client.say(defaultChannel, `MrDestructoid ${message} MrDestructoid`);
    }
  };

  return api;
}
