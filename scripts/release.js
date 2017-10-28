const { run, lernaExec } = require('./run')

// health check
lernaExec(`git pull`)
// lernaExec(`npm run preversion`)

const updated = JSON.parse(run('lerna updated --json'));

// increment version numbers accross all package.json's
run(`lerna publish --skip-npm --skip-git --exact`, { stdio: 'inherit' });
const { version, packages } = require('../lerna.json')
const versionStr = `v${version}`

// commit & tag version bumps
lernaExec(`git commit -am v${version}`, null, true)
lernaExec(`git tag ${versionStr} -m ${versionStr}`)

// push packages to npm & github (but only non-private repos)
updated
  .filter(update => !update.private)
  .forEach(update => run(`lerna exec --scope ${update.name} -- npm publish --access=public`));

lernaExec(`git push`)
lernaExec(`git push --tags`)

// commit & push version bump at monorepo level
run(`git add ${packages.join(' ')} lerna.json`)
run(`git commit -am ${versionStr}`)
run(`git tag ${versionStr} -m ${versionStr}`)
run(`git push`)
run(`git push --tags`)
