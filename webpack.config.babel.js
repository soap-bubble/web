import { loaders as styleLoaders } from '@soapbubble/style';
import nodeExternals from 'webpack-node-externals';
import path from 'path';
import packageJson from './package.json';
const webpackConfig = {
  entry: './src/index',
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: packageJson.name,
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ].concat(styleLoaders),
  },
  externals: [nodeExternals({
    // Only externalize JS files
    whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
  })],
};

module.exports = webpackConfig;
