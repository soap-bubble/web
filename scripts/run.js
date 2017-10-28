const spawnSync = require('cross-spawn').sync;

const run = (str, opts = {}, ignoreError = false) => {
  console.log(str)
  const [ cmd, ...args ] = str.split(' ')
  const { stdout, stderr, status } = spawnSync(cmd, args, Object.assign({}, opts, { encoding: 'utf8' }))
  if (status !== 0 && !ignoreError) {
    console.log(stdout);
    console.error(stderr);
    process.exit();
  }
  return stdout;
}
module.exports = run;
module.exports.run = run;

const lernaExec = (cmd, opts, ignoreError) => run(`lerna exec ${
  !ignoreError ? '--bail=false ' : ''
}-- ${cmd}`, opts)

module.exports.lernaExec = lernaExec;
