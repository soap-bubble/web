const webpack = require('webpack');
const styleLoaders = require('@soapbubble/style').loaders;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const config = require('config');

const dirJs = path.resolve(__dirname, 'client/js');
const dirParent = path.resolve(__dirname, '../');
const dirSharedComponents = [
  path.join(dirParent, 'components'),
  path.join(dirParent, 'style'),
];

// cheap-module-eval-source-map
module.exports = (env) => {
  const outputPath = (() => {
    if (env.cordova) {
      return path.resolve(__dirname, '../cordova/www');
    }
    if (env.electron) {
      return path.resolve(__dirname, '../electron/build');
    }
    return path.resolve(__dirname, 'public');
  })();

  const publicPath = '';
  const htmlTemplate = (() => {
    if (env.cordova) {
      return 'cordova.ejs';
    }
    if (env.electron) {
      return 'electron.ejs';
    }
    return 'index.ejs';
  })();
  const cssName = env.production ? 'morpheus.[contenthash].css' : 'morpheus.css';
  const jsName = env.production ? '[name].[hash].js' : '[name].js';
  const vendorName = env.production ? '[name].[hash].js' : '[name].js';
  const appConfig = {};

  if ((env.production || env.cordova || env.electron) && !env.debug) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://soapbubble.online/morpheus',
      authHost: 'https://soapbubble.online/auth',
      botHost: 'https://soapbubble.online/bot',
    });
  } else if (env.staging) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://staging.soapbubble.online/morpheus',
      authHost: 'https://staging.soapbubble.online/auth',
    });
  }
  if (env.localSSL || process.env.SOAPBUBBLE_LOCAL_SSL) {
    Object.assign(appConfig, {
      assetHost: 'https://dev.soapbubble.online/morpheus',
      apiHost: 'https://dev.soapbubble.online/morpheus',
      authHost: 'https://dev.soapbubble.online/auth',
    });
  } else if (env.development) {
    Object.assign(appConfig, {
      assetHost: 'http://localhost:8050',
      apiHost: 'http://localhost:8050',
      authHost: 'http://localhost:4000',
    });
  }

  if (env.electron) {
    appConfig.apiHost = 'morpheus://';
  }
  const target = env.electron ? 'electron-renderer' : 'web';
  const mainFields = ['esnext', 'browser', 'module', 'main'];

  let nodeEnv = 'development';
  if (env.production) {
    nodeEnv = 'production';
  }

  const webpackDefineConfig = {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    'process.env.AUTOSTART': JSON.stringify(env.electron || env.cordova),
    config: JSON.stringify(appConfig),
  };


  let devtool = env.development ? 'source-map' : false;
  if (env.cordova && env.development) {
    devtool = 'inline-source-map';
  }

  let webpackConfig = {
    mode: nodeEnv,
    target,
    devtool,
    entry: {
      app: './client/js/app.jsx',
      browser: './client/js/browser.js',
      vendor: [
        '@soapbubble/style/dist/soapbubble.css',
        'babel-polyfill',
        'axios',
        'bluebird',
        'browser-bunyan',
        'classnames',
        'immutable',
        'keycode',
        'generic-pool',
        'local-storage',
        'lodash',
        'promise-queue',
        'query-string',
        'raf',
        'react',
        'redux',
        'react-dom',
        'react-redux',
        'redux-logger',
        'redux-observable',
        'redux-promise',
        'redux-thunk',
        'reselect',
        'tween',
        'three',
        'ua-parser-js',
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
      symlinks: false,
    },
    module: {
      rules: styleLoaders(env).concat([
        {
          test: /\.js$/,
          include: [/generic-pool/, /@soapbubble/],
          exclude: [/generic-pool\/node_modules/, /@soapbubble\/.*\/node_modules/],
          use: ['babel-loader'],
        },
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          include: dirSharedComponents.concat([
            dirJs,
          ]),
          use: ['babel-loader'],
        },
        {
          test: /\.png$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/png',
            },
          },
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/svg+xml',
            },
          },
        },
        {
          test: /\.css$/,
          include: [/@soapbubble\/style\/dist\/soapbubble.css/],
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
            },
            {
              loader: 'postcss-loader',
            },
          ],
        },
        {
          test: /\.css$/,
          include: [/@soapbubble/],
          exclude: [/@soapbubble\/style\/dist\/soapbubble.css/],
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
              },
            },
            { loader: 'postcss-loader' },
          ],
        },
      ]),
    },
    plugins: [
      new MiniCssExtractPlugin({
        chunkFilename: '[id].css',
        disable: !env.production,
      }),
      new HtmlWebpackPlugin({
        title: 'Morpheus',
        filename: 'index.html',
        template: `client/html/${htmlTemplate}`,
        googleAnalyticsClientId: config.googleAnalyticsClientId,
        chunks: ['vendor', 'app'],
      }),
      new HtmlWebpackPlugin({
        title: 'Morpheus Browser',
        filename: 'browser.html',
        template: 'client/html/index.ejs',
        googleAnalyticsClientId: config.googleAnalyticsClientId,
        chunks: ['vendor', 'browser'],
      }),
      new webpack.DefinePlugin(webpackDefineConfig),
    ],
  };
  if (env.electron) {
    const {
      output,
    } = webpackConfig;

    // convert to an array to also build service worker
    webpackConfig = [
      webpackConfig,
      {
        target,
        devtool,
        output,
        entry: {
          sw: './client/js/sw.js',
        },
        resolve: {
          extensions: ['.js', '.json'],
          mainFields,
          symlinks: false,
        },
        module: {
          rules: styleLoaders(env).concat([
            {
              test: /\.js?$/,
              include: dirSharedComponents.concat([
                dirJs,
              ]),
              exclude: [/node_modules/],
              use: ['babel-loader'],
            },
          ]),
        },
        plugins: [
          new webpack.DefinePlugin(webpackDefineConfig),
        ],
      },
    ];
  }

  return webpackConfig;
};
