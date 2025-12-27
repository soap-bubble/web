const fs = require('fs');
const path = require('path');
const { NODE_ENV } = process.env;

const prod = NODE_ENV === 'production';
const offline = NODE_ENV === 'offline';

const normalizeBasePath = (value) =>
  value ? value.trim().replace(/\/+$/, '') : value;

const DEFAULT_ASSET_BASE = '/morpheus-assets';
const configuredAssetBase =
  normalizeBasePath(
    process.env.NEXT_PUBLIC_MORPHEUS_ASSET_BASE ||
      process.env.MORPHEUS_ASSET_BASE,
  ) || DEFAULT_ASSET_BASE;

const env =
  prod || !offline
    ? {
        ASSET_HOST: '',
        FIREBASE_API_KEY: 'AIzaSyBqBCDGshTp3uKhVOSvwUkvEeX3Ui8xdsU',
        FIREBASE_AUTH_DOMAIN: 'soapbubble.firebaseapp.com',
        FIREBASE_DATABASE_URL: 'https://soapbubble.firebaseio.com',
        FIREBASE_PROJECT_ID: 'soapbubble',
        FIREBASE_STORAGE_BUCKET: 'soapbubble.appspot.com',
        FIREBASE_MESSAGING_SENDER_ID: '342061559353',
        FIREBASE_APP_ID: '1:342061559353:web:fffc5c9458f484d3a267e8',
      }
    : {
        ASSET_HOST: '',
      };

env.MORPHEUS_ASSET_BASE = configuredAssetBase;
env.NEXT_PUBLIC_MORPHEUS_ASSET_BASE = configuredAssetBase;

const morpheusAssetSource = path.resolve(__dirname, '../morpheus/dist/image');
const morpheusAssetDestination = path.resolve(
  __dirname,
  'public',
  configuredAssetBase.replace(/^\//, ''),
);

const syncMorpheusAssets = () => {
  if (!fs.existsSync(morpheusAssetSource)) {
    console.warn(
      '[morpheus-next] Skipping asset sync because source directory is missing:',
      morpheusAssetSource,
    );
    return;
  }
  fs.rmSync(morpheusAssetDestination, { recursive: true, force: true });
  fs.mkdirSync(morpheusAssetDestination, { recursive: true });
  fs.cpSync(morpheusAssetSource, morpheusAssetDestination, {
    recursive: true,
  });
};

syncMorpheusAssets();

module.exports = {
  env,
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  webpack(config) {
    const distRoot = path.resolve(__dirname, '../morpheus/dist/morpheus');
    config.resolve.alias = config.resolve.alias || {};
    const distEntry = path.join(distRoot, 'index.js');
    config.resolve.alias['morpheus'] = distEntry;
    config.resolve.alias['morpheus$'] = distEntry;
    config.resolve.alias['morpheus/'] = `${distRoot}/`;
    config.resolve.alias['@soapbubble/morpheus-client'] = distEntry;
    config.resolve.alias['@soapbubble/morpheus-client$'] = distEntry;
    config.resolve.alias['@soapbubble/morpheus-client/'] = `${distRoot}/`;
    return config;
  },
};
