// This is the base Webpack configuration file

const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const cssCustomProperties = require('postcss-custom-properties');
const postcssCalc = require('postcss-calc');

// project folder
const rootFolder = path.resolve(__dirname, '..');

const configuration = {
  // resolve all relative paths from the project root folder
  context: rootFolder,

  // https://webpack.github.io/docs/multiple-entry-points.html
  entry: {
    main: './src/application.entry.js',
  },

  output: {
    // filesystem path for static files
    path: path.resolve(rootFolder, 'build/assets'),

    // network path for static files
    publicPath: '/assets/',

    // file name pattern for entry scripts
    filename: '[name].[hash].js',

    // file name pattern for chunk scripts
    chunkFilename: '[name].[hash].js',
  },

  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
      }],
    },
    {
      test: /\.(scss)$/,
      use: [
        'style-loader',
        'css-loader?importLoaders=2&sourceMap',
        'postcss-loader',
        'sass-loader?outputStyle=expanded&sourceMap=true&sourceMapContents=true',
      ],
    },
    {
      test: /\.less$/,
      loaders: [
        'style-loader?sourceMap',
        'css-loader?importLoaders=1&sourceMap&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
        'postcss-loader',
        'less-loader',
      ],
    },
    {
      test: /\.(css)$/,
      use: [
        'style-loader',
        'css-loader?importLoaders=2&sourceMap',
        'postcss-loader',
      ],
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'file-loader',
    },
    {
      test: /\.(woff|woff2)$/,
      loader: 'url-loader?prefix=font/&limit=5000',
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader?limit=10000&mimetype=application/octet-stream',
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
    },
    {
      test: /\.(jpg|png)$/,
      use: [
        'url-loader?limit=10000', // Any png-image or woff-font below or equal to 10K will be converted to inline base64 instead
      ],
    },
    {
      test: /\.(svg)$/,
      use: [
        'svg-react-loader',
      ],
    }],
  },

  plugins: [],
};

configuration.plugins.push(
  new webpack.LoaderOptionsPlugin({
    test: /\.(less|scss|css)$/,
    debug: true,
    options: {
      // A temporary workaround for `scss-loader`
      // https://github.com/jtangelder/sass-loader/issues/298
      output: {
        path: configuration.output.path,
      },

      postcss: [
        autoprefixer({ browsers: 'last 2 version' }),
        cssCustomProperties(),
        postcssCalc(),
      ],

      // A temporary workaround for `css-loader`.
      // Can also supply `query.context` parameter.
      context: configuration.context,
    },
  }));

module.exports = configuration;
