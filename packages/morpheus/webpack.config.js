process.env.NODE_CONFIG_DIR = `${__dirname}/config`
const webpack = require('webpack')
const styleLoaders = require('@soapbubble/style').loaders
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { DuplicatesPlugin } = require('inspectpack/plugin')
const config = require('config')

const dirJs = path.resolve(__dirname, 'client/js')
const dirParent = path.resolve(__dirname, '../')
const dirSharedComponents = [
  path.join(dirParent, 'components', 'src'),
  path.join(dirParent, 'style'),
]

// cheap-module-eval-source-map
module.exports = env => {
  const outputPath = (() => {
    if (env.cordova) {
      return path.resolve(__dirname, '../cordova/www')
    } else if (env.electron) {
      return path.resolve(__dirname, '../electron/dist')
    } else if (env.firebase) {
      return path.resolve(__dirname, '../../public/morpheus')
    }
    return path.resolve(__dirname, 'public')
  })()

  let publicPath = ''
  const htmlTemplate = (() => {
    if (env.cordova) {
      return 'cordova.ejs'
    }
    if (env.electron) {
      return 'electron.ejs'
    }
    return 'index.ejs'
  })()
  let htmlFilename = 'index.html'
  const isProduction = env.production || env.staging
  const jsName = isProduction ? '[name].[hash].js' : '[name].js'
  const appConfig = {}

  if (env.firebase) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: '/api',
      authHost: 'https://soapbubble.web.app/auth',
      botHost: 'https://soapbubble.web.app/bot',
    })
  } else if ((env.production || env.cordova || env.electron) && !env.debug) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://soapbubble.online/morpheus',
      authHost: 'https://soapbubble.online/auth',
      botHost: 'https://soapbubble.online/bot',
    })
    if (env.production && !(env.cordova || env.electron)) {
      publicPath = '/morpheus/'
      htmlFilename = 'index-production.html'
    }
  } else if (env.staging) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://staging.soapbubble.online/morpheus',
      authHost: 'https://staging.soapbubble.online/auth',
    })
    if (!(env.cordova || env.electron)) {
      publicPath = '/morpheus/'
      htmlFilename = 'index-staging.html'
    }
    new DuplicatesPlugin({
      // Emit compilation warning or error? (Default: `false`)
      emitErrors: false,
      // Display full duplicates information? (Default: `false`)
      verbose: false,
    })
  }
  if (env.localSSL || process.env.SOAPBUBBLE_LOCAL_SSL) {
    Object.assign(appConfig, {
      assetHost: 'https://s3-us-west-2.amazonaws.com/soapbubble-morpheus-dev',
      apiHost: 'https://dev.soapbubble.online/morpheus',
      authHost: 'https://dev.soapbubble.online/auth',
    })
    if (!(env.cordova || env.electron)) {
      publicPath = '/morpheus/'
    }
  } else if (env.development) {
    Object.assign(appConfig, {
      assetHost: 'http://localhost:8050',
      apiHost: '/api',
      authHost: 'http://localhost:4000',
    })
  }

  const target = env.electron ? 'electron-renderer' : 'web'
  const mainFields = ['esnext', 'browser', 'module', 'main']

  let nodeEnv = 'development'
  if (isProduction) {
    nodeEnv = 'production'
  }

  const webpackDefineConfig = {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    'process.env.AUTOSTART': JSON.stringify(env.electron || env.cordova),
    config: JSON.stringify(appConfig),
  }

  const devToolOptions = {}

  if (env.development && !env.cordova) {
    devToolOptions.filename = '[file].map'
    if (env.localSSL || process.env.SOAPBUBBLE_LOCAL_SSL) {
      // devToolOptions.publicPath = 'https://dev.soapbubble.online/morpheus/';
    }
  }

  const externals = {
    greenworks: 'require("greenworks")',
  }
  if (!env.electron) {
    externals.electron = '_'
  }

  let webpackConfig = {
    mode: nodeEnv,
    target,
    devtool: false,
    entry: {
      app: './client/js/app.jsx',
      browser: './client/js/browser.js',
      vendor: [
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
        '@tweenjs/tween.js',
        'three',
        'ua-parser-js',
      ],
    },
    externals,
    output: {
      path: outputPath,
      filename: jsName,
      publicPath,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
      mainFields,
      alias: {
        service: path.resolve(__dirname, 'client/js/service'),
        morpheus: path.resolve(__dirname, 'client/js/morpheus'),
        utils: path.resolve(__dirname, 'client/js/utils'),
        soapbubble: path.resolve(__dirname, 'client/js/soapbubble'),
      },
    },
    module: {
      rules: styleLoaders(env).concat([
        {
          test: /\.jsx?$/,
          include: [/node_modules\/@soapbubble/, /node_modules\/generic-pool/],
          exclude: [
            /@soapbubble\/.*\/node_modules/,
            /generic-pool\/node_modules/,
          ],
          use: [
            {
              loader: 'babel-loader',
              options: {
                rootMode: 'upward-optional',
              },
            },
          ],
        },
        {
          test: /\.jsx?$/,
          include: [/generic-pool/],
          exclude: [/generic-pool\/node_modules/],
          use: ['babel-loader'],
        },
        {
          test: /\.tsx?$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                rootMode: 'upward-optional',
              },
            },
          ],
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
          include: [/@soapbubble/].concat(dirSharedComponents),
          exclude: [
            /@soapbubble\/style\/dist\/soapbubble.css/,
            /packages\/style\/dist\/soapbubble.css/,
          ],
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
      new CleanWebpackPlugin(),
      new DuplicatesPlugin({
        // Emit compilation warning or error? (Default: `false`)
        emitErrors: true,
        // Display full duplicates information? (Default: `false`)
        verbose: true,
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: '[id].[contenthash].css',
            }),
          ]
        : []),
      new HtmlWebpackPlugin({
        title: 'Morpheus',
        filename: htmlFilename,
        template: `client/html/${htmlTemplate}`,
        googleAnalyticsClientId: config.googleAnalyticsClientId,
        chunks: ['vendor', 'app'],
      }),
      new webpack.DefinePlugin(webpackDefineConfig),
    ].concat(
      env.development ? new webpack.SourceMapDevToolPlugin(devToolOptions) : []
    ),
  }

  return webpackConfig
}
