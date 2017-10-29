import { loaders as styleLoaders } from '@soapbubble/style';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import path from 'path';
import packageJson from './package.json';

module.exports = (env) => {
  const plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env.development ? 'development' : 'production'),
    }),
  ];

  if (!env.development) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      mangle: false,
    }));
  }

  const webpackConfig = {
    entry: {
      index: './src/index',
    },
    devtool: env.development ? 'inline-source-map' : '',
    output: {
      path: path.resolve('dist'),
      filename: '[name].js',
      libraryTarget: env.development ? 'var' : 'umd',
      library: packageJson.name.replace('@', '').replace('/', ''),
    },
    module: {
      rules: [
        { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      ].concat(styleLoaders),
    },
    externals: env.development ? [] : [nodeExternals({
      // Only externalize JS files
      whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
    })],
    plugins,
  };

  if (env.development) {
    webpackConfig.plugins.push(new HtmlWebpackPlugin({
      title: 'Soap Bubble Components',
      filename: 'index.html',
      template: 'views/index.ejs',
    }));
  }

  return webpackConfig;
};
