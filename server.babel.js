const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.babel');

const compiler = webpack(webpackConfig({
  development: true,
}));
const server = new WebpackDevServer(compiler);
server.listen(8080, 'localhost', () => {});
