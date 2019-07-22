const pkg = require('../package.json');

const twitchScope = 'user:read:broadcast user:edit:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit channel_read channel_editor user:read:email';

module.exports = {
  fbAppId: '',
  googleAnalyticsClientId: '',
  port: 8060,
  name: pkg.name,
  twitch: {
    production: {
      scope: twitchScope,
    },
    staging: {
      scope: twitchScope,
    },
    local: {
      scope: twitchScope,
    },
  }
};
