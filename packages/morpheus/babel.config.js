module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  babelrcRoots: ['../packages/*', './node_modules/@soapbubble/*'],
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    'transform-export-extensions',
    ['angularjs-annotate', { explicitOnly: true }],
    [
      '@babel/plugin-proposal-object-rest-spread',
      { loose: true, useBuiltIns: true },
    ],
    [
      'module-resolver',
      {
        root: ['./client/js'],
      },
    ],
  ],
}
