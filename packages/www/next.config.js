const fs = require('fs');
const path = require('path');
const { NODE_ENV } = process.env;

const prod = NODE_ENV === 'production';
const offline = NODE_ENV === 'offline';

const normalizeBasePath = (value) =>
  value ? value.trim().replace(/\/+$/, '') : value;

const DEFAULT_ASSET_BASE = '/morpheus-assets';
const configuredGameDbOrigin = normalizeBasePath(
  process.env.NEXT_PUBLIC_MORPHEUS_GAMEDB_ORIGIN ||
    process.env.MORPHEUS_GAMEDB_ORIGIN,
);
const configuredAssetBase =
  normalizeBasePath(
    process.env.NEXT_PUBLIC_MORPHEUS_ASSET_BASE ||
      process.env.MORPHEUS_ASSET_BASE,
  ) || DEFAULT_ASSET_BASE;

const env = {};

env.MORPHEUS_ASSET_BASE = configuredAssetBase;
env.NEXT_PUBLIC_MORPHEUS_ASSET_BASE = configuredAssetBase;
env.MORPHEUS_GAMEDB_ORIGIN = configuredGameDbOrigin;
env.NEXT_PUBLIC_MORPHEUS_GAMEDB_ORIGIN = configuredGameDbOrigin;

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
    const srcRoot = path.resolve(__dirname, '../morpheus/client/js');
    const morpheusRoot = path.join(srcRoot, 'morpheus');
    config.resolve.alias = config.resolve.alias || {};
    const srcEntry = path.join(morpheusRoot, 'index.ts');
    config.resolve.alias['morpheus'] = srcEntry;
    config.resolve.alias['morpheus$'] = srcEntry;
    config.resolve.alias['morpheus/'] = `${morpheusRoot}/`;
    config.resolve.alias['service'] = path.join(srcRoot, 'service');
    config.resolve.alias['service/'] = `${path.join(srcRoot, 'service')}/`;
    config.resolve.alias['store'] = path.join(srcRoot, 'store');
    config.resolve.alias['store/'] = `${path.join(srcRoot, 'store')}/`;
    config.resolve.alias['utils'] = path.join(srcRoot, 'utils');
    config.resolve.alias['utils/'] = `${path.join(srcRoot, 'utils')}/`;
    return config;
  },
};
