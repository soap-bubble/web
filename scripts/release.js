const argv = require('minimist')(process.argv.slice(2));
const { run, lernaExec } = require('./run');
const updated = JSON.parse(run('lerna updated --json'));

const bump = argv.bump ? argv.bump : 'patch';

// increment version numbers accross all package.json's
run(`lerna publish -y --exact ${bump}`);
const { version, packages } = require('../lerna.json')
const versionStr = `v${version}`

// push packages to npm & github (but only non-private repos)
updated
  .filter(update => !update.private)
  .forEach(update => run(`lerna exec --scope ${update.name} -- npm publish --access=public`));

// commit & push version bump at monorepo level
run(`git add ${packages.join(' ')} lerna.json`)
run(`git commit -am ${versionStr}`)
run(`git tag ${versionStr} -m ${versionStr}`)
run(`git push`)
run(`git push --tags`)
