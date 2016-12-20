const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    app: './client/js/app.jsx',
    vendor: ['lodash', 'three'],
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
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
      }, {
        test: /\.json$/,
        loader: 'json',
      },
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
  ],
};
