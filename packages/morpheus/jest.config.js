module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['client/**/*.{ts,tsx,js,jsx}'],
  setupFiles: ['<rootDir>/config/polyfills.js'],
  watchPathIgnorePatterns: ['<rootDir>//public'],
  testURL: 'http://localhost',
  transform: {
    '^.+\\.((j|t)sx?)$': '<rootDir>/jestBabelProcessor.js',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
}
