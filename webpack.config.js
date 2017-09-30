const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = env => {
  const sassLoaders = ["css-loader", "postcss-loader", "sass-loader"];
  const cssLoaders = ["css-loader", "postcss-loader"];
  return {
    entry: './build.js',
    output: {
      filename: 'dist.js',
    },
    module: {
      rules: [
        {
          test: /\.(scss|sass)$/,
          use: env.development ? ["style-loader"].concat(sassLoaders) : ExtractTextPlugin.extract({ use: sassLoaders }),
        },
        {
          test: /\.css$/,
          use:  env.development ? ["style-loader"].concat(cssLoaders) : ExtractTextPlugin.extract({ use: cssLoaders }),
        },
      ],
    },
    plugins: [
      new ExtractTextPlugin({
        filename: 'soapbubble.css',
      }),
    ],
  };
};
