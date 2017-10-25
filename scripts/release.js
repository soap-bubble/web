const { run, lernaExec } = require('./run')

// health check
lernaExec(`git pull`)
// lernaExec(`npm run preversion`)

// increment version numbers accross all package.json's
run(`lerna publish --skip-npm --skip-git --exact`, { stdio: 'inherit' });
const { version, packages } = require('../lerna.json')
const versionStr = `v${version}`



// push packages to npm & github (but only non-private repos)
const updated = JSON.parse(run('lerna updated --json'));
updated
  .forEach(update => {
    // commit & tag version bumps
    run(`lerna exec --scope ${update.name} -- git commit -am v${version}`)
    run(`lerna exec --scope ${update.name} -- git tag ${versionStr} -m ${versionStr}`)
  })

updated
  .filter(update => !update.private)
  .forEach(update => run(`lerna exec --scope ${update.name} -- npm publish --access=public`));

lernaExec(`git push`)
lernaExec(`git push --tags`)

// commit & push version bump at monorepo level
updated.forEach(update => {})
run(`git add ${packages.join(' ')} lerna.json`)
run(`git commit -m ${versionStr}`)
run(`git tag ${versionStr} -m ${versionStr}`)
run(`git push`)
run(`git push --tags`)
