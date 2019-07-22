const pkg = require('../package.json');

module.exports = {
  fbAppId: '',
  googleAnalyticsClientId: '',
  port: 8060,
  name: pkg.name,
  twitch: {
    scope: 'user:read:broadcast user:edit:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit channel_read channel_editor user:read:email',
  }
};
