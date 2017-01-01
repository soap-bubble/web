module.exports = function(config) {
  config.set({
    // ... normal karma configuration

    frameworks: ['mocha', 'sinon-chai'],

    plugins: [
      'karma-mocha',
      'karma-sinon-chai',
      'karma-sourcemap-loader',
      'karma-webpack'
    ],
    files: [
      // all files ending in "_test"
      'client/js/**/*.test.js'
      // each file acts as entry point for the webpack configuration
    ],

    preprocessors: {
      // add webpack as preprocessor
      'client/js/**/*.test.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map', //just do inline source maps instead of the default
      module: {
        loaders: [
          { test: /\.js$/, loader: 'babel-loader', exclude: /(node_modules|bower_components)/ }
        ]
      }
    },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      noInfo: true
    }
  });
};