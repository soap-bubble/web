const webpack = require('webpack');
const path = require('path');
// cheap-module-eval-source-map
module.exports = {
  target: 'web',
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
    path: path.join(__dirname, 'public/js'),
    filename: '[name].bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'client', 'js'),
        ],
        use: ['babel-loader'],
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
    new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'vendor.bundle.js' }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    }),
  ],
};
