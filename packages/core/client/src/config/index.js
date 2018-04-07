const env = process.env.NODE_ENV;
if (['development', 'production'].indexOf(env) !== -1) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  module.exports = require(`./${env}`);
}
