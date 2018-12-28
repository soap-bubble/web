const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const loaders = require('./index').loaders;
module.exports = env => {
  const sassLoaders = ["css-loader", "postcss-loader", "sass-loader"];
  const cssLoaders = ["css-loader", "postcss-loader"];
  return {
    mode: env.production ? 'production': 'development',
    entry: './build.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: loaders(env),
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'soapbubble.css',
      }),
    ],
  };
};
