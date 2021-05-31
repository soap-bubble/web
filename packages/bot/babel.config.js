const presets = [
  [
    '@babel/env',
    {
      targets: {
        node: true,
      },
      corejs: 3,
      useBuiltIns: 'usage',
    },
  ],
  [
    '@babel/preset-typescript',
    {
      allExtensions: true,
    },
  ],
]

module.exports = { presets }
