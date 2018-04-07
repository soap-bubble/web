import Discord from 'discord.js';

export default function ({
  token,
}) {
  const client = new Discord.Client();

  client.on('ready', () => {
    // console.log('I am ready!');
  });

  client.login(token);

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
