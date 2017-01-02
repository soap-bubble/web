const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  target: 'web',
  entry: {
    app: './client/js/app.jsx',
    vendor: ['lodash', 'react', 'react-redux', 'redux', 'react-dom'],
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name]_[hash].bundle.js',
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
        ],
        loader: 'babel-loader',
      }, {
        test: /\.json$/,
        loader: 'json',
      }, {
      	test: /\.less$/,
        include: [
          path.resolve(__dirname, 'client', 'less'),
        ],
      	loaders: [
      		'style?sourceMap',
      		'css?importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
      		'less'
      	]
      }, {
      	test: /\.css$/,
      	loaders: [
      		'style?sourceMap',
      		'css?importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
      	]
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file"
      },
      {
        test: /\.(woff|woff2)$/,
        loader: "url?prefix=font/&limit=5000"
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/octet-stream"
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=image/svg+xml"
      },
      {
        test: /\.gif/,
        loader: "url-loader?limit=10000&mimetype=image/gif"
      },
      {
        test: /\.jpg/,
        loader: "url-loader?limit=10000&mimetype=image/jpg"
      },
      {
        test: /\.png/,
        loader: "url-loader?limit=10000&mimetype=image/png"
      }
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor_[hash].bundle.js'),
    new HtmlWebpackPlugin({
      title: 'Soap Bubble Productions',
      template: './client/html/index.html',
      favicon: './client/html/favicon.ico',
    }),
    new CleanWebpackPlugin(['public'], {
      verbose: true,
    }),
  ],
};
