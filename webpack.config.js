const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const config = require('config');
const fs = require('fs');
const pathIsInside = require('path-is-inside');
const findRoot = require('find-root');

const PROPKEY_ESNEXT = 'esnext';
const dir_js = path.resolve(__dirname, 'client/js');
const dirSoapbubbleComponents = path.resolve(__dirname, '../components');
const dir_node_modules = path.resolve(__dirname, 'node_modules');

/**
 * Find package.json for file at `filepath`.
 * Return `true` if it has a property whose key is `PROPKEY_ESNEXT`.
 */
function hasPkgEsnext(filepath) {
  const pkgRoot = findRoot(filepath);
  const packageJsonPath = path.resolve(pkgRoot, 'package.json');
  const packageJsonText = fs.readFileSync(packageJsonPath,
    { encoding: 'utf-8' });
  const packageJson = JSON.parse(packageJsonText);
  const hasNextProp = {}.hasOwnProperty.call(packageJson, PROPKEY_ESNEXT); // (A)
  if (hasNextProp) {
    return hasNextProp;
  }
}

// cheap-module-eval-source-map
module.exports = (env) => {
  const cssName = env.production ? 'morpheus.[contenthash].css' : 'morpheus.css';
  const jsName = env.production ? '[name].[hash].js' : '[name].js';
  const vendorName = env.production ? '[name].[hash].js' : '[name].js';
  const webpackConfig = {
    target: 'web',
    devtool: env.production ? null : 'source-map',
    entry: {
      app: './client/js/app.jsx',
      vendor: [
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
        'babel-polyfill',
      ],
    },
    output: {
      path: path.join(__dirname, 'public'),
      filename: jsName,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      mainFields: ['esnext', 'browser', 'module', 'main'],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: [
            path.resolve(__dirname, 'client', 'js'),
            path.resolve(__dirname, '..', 'components'),
            filepath =>
              pathIsInside(filepath, dir_node_modules) &&
              hasPkgEsnext(filepath),
          ],
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
      ],
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
        template: 'client/html/index.ejs',
        googleAnalyticsClientId: config.googleAnalyticsClientId,
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
      }),
    ],
  };

  if (env.production) {
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }));
  }

  return webpackConfig;
};
