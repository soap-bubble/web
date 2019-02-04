const webpack = require('webpack');
const styleLoaders = require('@soapbubble/style').loaders;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
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
  if (env.production) {
    nodeEnv = 'production';
  }

  const outputPath = path.join(__dirname, 'public');
  const htmlTemplate = 'index.ejs';
  const cssName = env.production ? 'main.[contenthash].css' : 'main.css';
  const jsName = env.production ? '[name].[hash].js' : '[name].js';
  const vendorName = env.production ? '[name].[hash].js' : '[name].js';
  const appConfig = {
    twitch: config.twitch,
    contentfulSpace: config.contentfulSpace,
    contentfulAccess: config.contentfulAccess,
    contentfulEnv: 'development',
  };

  if (env.production) {
    Object.assign(appConfig, {
      self: 'https://soapbubble.online',
      morpheusServer: 'https://morpheus.soapbubble.online',
      authHost: 'https://auth.soapbubble.online',
      contentfulEnv: 'master',
    });
  } else if (env.staging) {
    Object.assign(appConfig, {
      self: 'https://staging.soapbubble.online',
      morpheusServer: 'https://morpheus.staging.soapbubble.online',
      authHost: 'https://auth.staging.soapbubble.online',
      contentfulEnv: 'master',
    });
  }
  if (env.development) {
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
    devtool: env.production ? false : 'source-map',
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
          exclude: [/node_modules/],
          include: dirSharedComponents.concat([
            dirJs,
          ]),
          use: ['babel-loader'],
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
          ]
        },
        {
          test: /\.css$/,
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
          ]
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
            loader: 'sass-loader' // compiles Sass to CSS
          }]
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
            loader: 'sass-loader' // compiles Sass to CSS
          }]
        },
        { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url-loader?limit=10000&mimetype=application/font-woff" },
        { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,  loader: "url-loader?limit=10000&mimetype=application/font-woff" },
        { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file-loader" },
        { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
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
        chunkFilename: "[id].css",
        disable: !env.production,
      }),
      new HtmlWebpackPlugin({
        title: 'Soapbubble Productions',
        filename: 'index.html',
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
