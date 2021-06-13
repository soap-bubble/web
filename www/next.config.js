const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase, { defaultConfig }) => {
  const defaultEnv = {
    ASSET_HOST: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
    FIREBASE_API_KEY: 'AIzaSyBqBCDGshTp3uKhVOSvwUkvEeX3Ui8xdsU',
    FIREBASE_AUTH_DOMAIN: 'soapbubble.firebaseapp.com',
    FIREBASE_DATABASE_URL: 'https://soapbubble.firebaseio.com',
    FIREBASE_PROJECT_ID: 'soapbubble',
    FIREBASE_STORAGE_BUCKET: 'soapbubble.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: '342061559353',
    FIREBASE_APP_ID: '1:342061559353:web:fffc5c9458f484d3a267e8'
  };
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...defaultConfig,
      env: {
        WWW_HOST: 'http://localhost:3000',
        ...defaultEnv
      }
    };
  }

  return {
    ...defaultConfig,
    env: {
      WWW_HOST: 'https://next.soapbubble.online',
      ...defaultEnv
    }
  };
};
