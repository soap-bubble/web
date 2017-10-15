const { run, lernaExec } = require('./run')

// health check
lernaExec(`git pull`)
// lernaExec(`npm run preversion`)

// increment version numbers accross all package.json's
run(`lerna publish --skip-npm --skip-git --exact`)
const { version, packages } = require('../lerna.json')
const versionStr = `v${version}`

// commit & tag version bumps
lernaExec(`git commit -am v${version}`)
lernaExec(`git tag ${versionStr} -m ${versionStr}`)

// push packages to npm & github
lernaExec(`npm publish`)

lernaExec(`git push && git push --tags`)

// commit & push version bump at monorepo level
run(`git add ${packages.join(' ')} lerna.json`)
run(`git commit -m ${versionStr}`)
run(`git tag ${versionStr} -m ${versionStr}`)
run(`git push`)
run(`git push --tags`)
