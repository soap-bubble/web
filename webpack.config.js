const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    app: './client/js/app.jsx',
    vendor: [
      'lodash',
      'three',
      'react',
      'react-redux',
      'redux',
      'react-dom',
      'raf',
      'redux-promise',
      'redux-thunk',
      'dis-gui',
      'classnames',
      'bluebird',
      'babel-polyfill',
    ],
  },
  output: {
    path: path.join(__dirname, 'public/js'),
    filename: '[name].bundle.js',
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'client', 'js'),
          path.resolve(__dirname, 'node_modules', 'dis-gui'),
        ],
        loader: 'babel-loader',
      }, {
        test: /\.json$/,
        loader: 'json',
      },
      {
        test: /\.png/,
        loader: 'url-loader?limit=10000&mimetype=image/png',
      },
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    }),
  ],
};
