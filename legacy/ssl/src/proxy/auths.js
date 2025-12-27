module.exports = function init() {
  return (type) => {
    if (type === 'basic') {
      const auth = require('http-auth');
      return [
        opts => auth.connect(auth.basic(Object.assign({}, opts))),
        (basic, req, res, next) => basic(req, res, next),
      ];
    }
    throw new Error(`Auth type $${type} not defined`);
  };
}
