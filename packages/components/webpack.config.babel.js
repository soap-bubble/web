import { loaders as styleLoaders } from '@soapbubble/style';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import packageJson from './package.json';

module.exports = (env) => {
  const plugins = [
  ];
  const styles = styleLoaders(env);

  const webpackConfig = {
    entry: {
      index: './src/index',
    },
    mode: env.production ? 'production': 'development',
    devtool: env.development ? 'inline-source-map' : '',
    output: {
      path: path.resolve('dist'),
      filename: '[name].js',
      libraryTarget: 'umd',
      library: packageJson.name.replace('@', '').replace('/', ''),
    },
    module: {
      rules: [
        { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
        {
          test: /\.svg$/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/svg',
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
              },
            },
            { loader: 'postcss-loader' },
          ],
        },
      ].concat(styles),
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

  if (env.production) {
    webpackConfig.plugins.push(new MiniCssExtractPlugin({
      chunkFilename: "[id].css",
    }))
  }

  return webpackConfig;
};
