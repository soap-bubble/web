const webpack = require('webpack');

module.exports = {
  target: "web",
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015']
        }
      }, {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  }
}