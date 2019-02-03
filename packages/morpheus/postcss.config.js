module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-url'),
    require('precss'),
    require('postcss-preset-env')({
      browsers: 'last 2 versions',
    }),
  ],
};
