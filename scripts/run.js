const spawnSync = require('cross-spawn').sync;

const run = (str, opts = {}) => {
  console.log(str)
  const [ cmd, ...args ] = str.split(' ')
  const { status } = spawnSync(cmd, args, Object.assign({}, opts, { stdio: 'inherit' }))
  if (status !== 0) process.exit()
}
module.exports = run;
module.exports.run = run;

const lernaExec = (cmd, opts) => run(`lerna exec -- ${cmd}`, opts)

module.exports.lernaExec = lernaExec;
