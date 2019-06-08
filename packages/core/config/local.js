module.exports = {
  twitch: {
    clientID: process.env.SOAPBUBBLE_LOCAL_SSL ? 'hm9fvqu9wpmeqcb8d0np8xsdgcrqnr' : 'sprlzg25iypn1s4id029ib17lscmq0',
    callbackURL: process.env.SOAPBUBBLE_LOCAL_SSL ? 'https://dev.soapbubble.online/auth/twitch/callback' : 'http://localhost:4000/twitch/callback',
    scope: 'user:read:broadcast user:edit:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit channel_read channel_editor user:read:email',
  },
  contentfulSpace: 'p6v4av897809',
  contentfulAccess: '9745c1afb29538fbbcbc294ad0a88ef87aea462ddb1bbcf980d4f1efef8b567e',
};
