if (process.env.NODE_ENV !== 'production') {
  module.exports = [...require('morpheus.map.json')]
} else {
  module.exports = []
}
