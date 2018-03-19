module.exports = require('babel-jest').createTransformer({
  presets: ['react', 'env'],
  plugins: [
    'transform-export-extensions',
    ['transform-object-rest-spread', { useBuiltIns: true }],
    ['module-resolver', {
      root: ['./client/js'],
    }],
  ],
});
