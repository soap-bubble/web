module.exports = {
  presets: ['@babel/preset-react', '@babel/preset-env'],
  babelrcRoots: [
    '../packages/*',
    './node_modules/@soapbubble/*',
  ],
  plugins: [
    'transform-export-extensions',
    ['angularjs-annotate', { explicitOnly: true }],
    ['@babel/plugin-proposal-object-rest-spread', { loose: true, useBuiltIns: true }],
    ['module-resolver', {
      alias: {
        app: ['./client/src'],
      },
    }],
  ],
};
