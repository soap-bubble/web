const MiniCssExtractPlugin = require("mini-css-extract-plugin");
exports.loaders = (env) => [{
  test: /\.(scss)$/,
  use: [{
    loader: env.production ? MiniCssExtractPlugin.loader : 'style-loader',
  }, {
    loader: 'css-loader', // translates CSS into CommonJS modules
  }, {
    loader: 'postcss-loader', // Run post css actions
  }, {
    loader: 'sass-loader' // compiles Sass to CSS
  }]
}];
