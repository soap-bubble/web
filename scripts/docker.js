const { run } = require('./run')

run('./node_modules/.bin/lerna exec --scope @soapbubble/auth --scope @soapbubble/core --scope @soapbubble/morpheus -- docker build .');
