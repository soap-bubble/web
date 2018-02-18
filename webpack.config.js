const webpack = require('webpack');
const styleLoaders = require('@soapbubble/style').loaders;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const config = require('config');

const dirJs = path.resolve(__dirname, 'client/src');
const dirParent = path.resolve(__dirname, '../');
const dirSharedComponents = [
  path.join(dirParent, 'components'),
  path.join(dirParent, 'style'),
];

// cheap-module-eval-source-map
module.exports = (env) => {
  const outputPath = (() => {
    if (env.phonegap) {
      return path.resolve(__dirname, '../phonegap/www');
    }
    if (env.electron) {
      return path.resolve(__dirname, '../electron/build');
    }
    return path.join(__dirname, 'public');
  })();

  const htmlTemplate = 'index.ejs';
  const cssName = env.production ? 'main.[contenthash].css' : 'main.css';
  const jsName = env.production ? '[name].[hash].js' : '[name].js';
  const vendorName = env.production ? '[name].[hash].js' : '[name].js';
  const appConfig = {};

  if (env.production) {
    Object.assign(appConfig, {
      self: 'https://soapbubble.online',
      morpheusServer: 'https://morpheus.soapbubble.online',
      authHost: 'https://auth.soapbubble.online',
    });
  } else if (env.staging) {
    Object.assign(appConfig, {
      self: 'https://staging.soapbubble.online',
      morpheusServer: 'https://morpheus.staging.soapbubble.online',
      authHost: 'https://auth.staging.soapbubble.online',
    });
  } else {
    Object.assign(appConfig, {
      self: 'http://localhost:8060',
      morpheusServer: 'http://localhost:8050',
      authHost: 'http://localhost:4000',
    });
  }

  const publicPath = `${appConfig.self}/`;
  const target = 'web';
  const mainFields = (env.production || env.staging)
    ? ['browser', 'module', 'main']
    : ['esnext', 'browser', 'module', 'main'];

  const webpackConfig = {
    target,
    devtool: env.production ? false : 'source-map',
    entry: {
      app: './client/src/app.js',
      vendor: [
        'axios',
        'lodash',
        'react',
        'redux',
        'react-dom',
        'react-redux',
        'redux-logger',
        'redux-observable',
        'redux-thunk',
        'reselect',
        'classnames',
        'babel-polyfill',
      ],
    },
    output: {
      path: outputPath,
      filename: jsName,
      publicPath,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      mainFields,
    },
    module: {
      rules: styleLoaders.concat([
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          include: dirSharedComponents.concat([
            dirJs,
          ]),
          use: ['babel-loader'],
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader'],
          }),
        },
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'less-loader'],
          }),
        },
        {
          test: /\.(scss|sass)$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader'],
          }),
        },
        {
          test: /\.png/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/png',
            },
          },
        },
      ]),
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: vendorName }),
      new ExtractTextPlugin({
        filename: cssName,
        disable: !env.production,
      }),
      new HtmlWebpackPlugin({
        title: 'Soapbubble Productions',
        filename: 'index.html',
        template: `client/assets/html/${htmlTemplate}`,
        googleAnalyticsClientId: config.googleAnalyticsClientId,
        fbAppId: config.fbAppId,
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
        config: JSON.stringify(appConfig),
      }),
    ],
  };

  if (env.production) {
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      mangle: false,
    }));
  }

  return webpackConfig;
};
