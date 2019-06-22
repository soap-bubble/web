module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-env'],
  babelrcRoots: [
    '../packages/*',
    './node_modules/@soapbubble/*',
  ],
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    'transform-export-extensions',
    ['angularjs-annotate', { explicitOnly: true }],
    ['@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true }],
    ['module-resolver', {
      root: ['./client/js'],
    }],
  ],
};
