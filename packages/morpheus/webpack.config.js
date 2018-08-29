const webpack = require('webpack');
const styleLoaders = require('@soapbubble/style').loaders;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
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
    if (env.phonegap) {
      return path.resolve(__dirname, '../phonegap/www');
    }
    if (env.electron) {
      return path.resolve(__dirname, '../electron/build');
    }
    return path.resolve(__dirname, 'public');
  })();

  const publicPath = '';
  const htmlTemplate = (() => {
    if (env.phonegap) {
      return 'phonegap.ejs';
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

  if (env.production) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://morpheus.soapbubble.online',
      authHost: 'https://auth.soapbubble.online',
      botHost: 'https://bot.soapbubble.online',
    });
  } else if (env.staging) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://morpheus.soapbubble.online',
      authHost: 'https://auth.soapbubble.online',
      botHost: 'https://bot.staging.soapbubble.online',
    });
  } else {
    Object.assign(appConfig, {
      assetHost: '',
      apiHost: '',
      authHost: 'http://localhost:4000',
      botHost: 'http://localhost:8040',
    });
  }

  if (env.phonegap) {
    if (env.production) {
      appConfig.assetHost = appConfig.apiHost = 'https://morpheus.soapbubble.online';
    } else {
      appConfig.assetHost = appConfig.apiHost = 'http://192.168.1.5:8050';
      appConfig.authHost = 'http://192.168.1.5:4000';
    }
  } else if (env.electron) {
    appConfig.assetHost = appConfig.assetHost || 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev';
    appConfig.apiHost = 'morpheus://';
    appConfig.authHost = appConfig.authHost || 'https://auth.soapbubble.online';
    appConfig.botHost = appConfig.botHost || 'https://bot.soapbubble.online';
    // if (env.production) {
    //   appConfig.assetHost = appConfig.apiHost = 'https://morpheus.soapbubble.online';
    // } else {
    //   appConfig.assetHost = appConfig.apiHost = 'http://localhost:8050';
    //   appConfig.authHost = 'http://localhost:4000';
    // }
  }
  const target = env.electron ? 'electron-renderer' : 'web';
  const mainFields = (env.production || env.staging)
    ? ['browser', 'module', 'main']
    : ['esnext', 'browser', 'module', 'main'];

  const webpackDefineConfig = {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    'process.env.ELECTRON_ENV': `${env.electron}`,
    config: JSON.stringify(appConfig),
  };

  let webpackConfig = {
    target,
    devtool: env.production ? false : 'source-map',
    entry: {
      app: './client/js/app.jsx',
      vendor: [
        'babel-polyfill',
        'axios',
        'lodash',
        'bluebird',
        'query-string',
        'immutable',
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
        'user-agent-parser',
        'classnames',
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
          include: dirSharedComponents.concat([
            dirJs,
          ]),
          exclude: [/node_modules/],
          use: ['babel-loader'],
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
        title: 'Morpheus',
        filename: 'index.html',
        template: `client/html/${htmlTemplate}`,
        googleAnalyticsClientId: config.googleAnalyticsClientId,
      }),
      new webpack.DefinePlugin(webpackDefineConfig),
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

  if (env.electron) {
    const {
      output,
      devtool,
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
        },
        module: {
          rules: styleLoaders.concat([
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
