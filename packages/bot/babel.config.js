const presets = [
  [
    "@babel/env",
    {
      targets: {
        node: true,
      },
      useBuiltIns: "usage",
    },
  ],
  [
    "@babel/preset-typescript", 
    {
      isTSX: true,
      allExtensions: true
    }
  ]
];

module.exports = { presets };
