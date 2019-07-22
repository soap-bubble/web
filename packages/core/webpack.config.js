const webpack = require('webpack');
const styleLoaders = require('@soapbubble/style').loaders;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const config = require('config');

const dirJs = path.resolve(__dirname, 'client/src');
const dirParent = path.resolve(__dirname, '../');
const dirSharedComponents = [
  path.join(dirParent, 'components'),
  path.join(dirParent, 'style'),
];

// cheap-module-eval-source-map
module.exports = (env) => {
  let nodeEnv = 'development';
  const isProduction = env.production || env.staging;
  if (isProduction) {
    nodeEnv = 'production';
  }

  const outputPath = path.join(__dirname, 'public');
  const htmlTemplate = 'index.ejs';
  const jsName = isProduction ? '[name].[hash].js' : '[name].js';
  let htmlFilename = 'index.html';
  const appConfig = {
    twitch: config.twitch,
    contentfulSpace: config.contentfulSpace,
    contentfulAccess: config.contentfulAccess,
    contentfulEnv: 'development',
  };

  if (env.production) {
    Object.assign(appConfig, {
      self: 'https://soapbubble.online',
      morpheusServer: 'https://soapbubble.online/morpheus',
      authHost: 'https://soapbubble.online/auth',
      contentfulEnv: 'master',
    });
    htmlFilename = 'index-production.html';
  } else if (env.staging) {
    Object.assign(appConfig, {
      self: 'https://staging.soapbubble.online',
      morpheusServer: 'https://staging.soapbubble.online/morpheus',
      authHost: 'https://staging.soapbubble.online/auth',
      contentfulEnv: 'master',
    });
    htmlFilename = 'index-staging.html';
  }
  if (env.localSSL || process.env.SOAPBUBBLE_LOCAL_SSL) {
    Object.assign(appConfig, {
      self: 'https://dev.soapbubble.online',
      morpheusServer: 'https://dev.soapbubble.online/morpheus',
      authHost: 'https://dev.soapbubble.online/auth',
    });
  } else if (env.development) {
    Object.assign(appConfig, {
      self: 'http://localhost:8060',
      morpheusServer: 'http://localhost:8050',
      authHost: 'http://localhost:4000',
    });
  }

  const publicPath = `${appConfig.self}/`;
  const target = 'web';
  const mainFields = ['esnext', 'browser', 'module', 'main'];

  const webpackConfig = {
    target,
    mode: nodeEnv,
    devtool: isProduction ? false : 'source-map',
    entry: {
      app: './client/src/app.js',
      vendor: [
        '@soapbubble/style/dist/soapbubble.css',
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
      rules: [
        {
          test: /\.jsx?$/,
          include: [/node_modules\/@soapbubble/],
          exclude: [/@soapbubble\/.*\/node_modules/],
          use: [{
            loader: 'babel-loader',
            options: {
              rootMode: 'upward-optional',
            },
          }],
        },
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          use: [{
            loader: 'babel-loader',
            options: {
              rootMode: 'upward-optional',
            },
          }],
        },
        {
          test: /\.css$/,
          include: [/@soapbubble\/style\/dist\/soapbubble.css/, /packages\/style\/dist\/soapbubble.css/],
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
          include: [/@soapbubble/].concat(dirSharedComponents).concat(dirJs),
          exclude: [/@soapbubble\/style\/dist\/soapbubble.css/, /packages\/style\/dist\/soapbubble.css/],
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
        {
          test: /\.less/,
          use: [{
            loader: MiniCssExtractPlugin.loader,
          }, {
            loader: 'css-loader', // translates CSS into CommonJS modules
          }, {
            loader: 'postcss-loader', // Run post css actions
          }, {
            loader: 'sass-loader', // compiles Sass to CSS
          }],
        },
        {
          test: /\.(scss|sass)$/,
          use: [{
            loader: MiniCssExtractPlugin.loader,
          }, {
            loader: 'css-loader', // translates CSS into CommonJS modules
          }, {
            loader: 'postcss-loader', // Run post css actions
          }, {
            loader: 'sass-loader', // compiles Sass to CSS
          }],
        },
        { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
        { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
        { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
        { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml' },
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
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].[chunkhash].css',
        disable: !isProduction,
      }),
      new HtmlWebpackPlugin({
        title: 'Soapbubble Productions',
        filename: htmlFilename,
        template: `client/assets/html/${htmlTemplate}`,
        googleAnalyticsClientId: config.googleAnalyticsClientId,
        fbAppId: config.fbAppId,
        chunks: ['app', 'vendor'],
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${nodeEnv}"`,
        config: JSON.stringify(appConfig),
      }),
    ],
  };

  return webpackConfig;
};
