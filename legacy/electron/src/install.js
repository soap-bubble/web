import { app } from 'electron';

module.exports = () => {
    if(require('electron-squirrel-startup')) app.quit();
    return Promise.resolve();
}
//
// export default async function init() {
//   if(await handleSquirrelEvent()) {
//     app.quit();
//   }
// }
//
// async function handleSquirrelEvent() {
//   if (process.argv.length === 1) {
//     return false;
//   }
//
//   const ChildProcess = require('child_process');
//   const path = require('path');
//
//   const appFolder = path.resolve(process.execPath, '..');
//   const rootAtomFolder = path.resolve(appFolder, '..');
//   const updateDotExe = path.resolve('./Update.exe');
//   const exeName = path.basename(process.execPath);
//
//   const spawn = function(command, args) {
//     return new Promise((resolve, reject) => {
//       let spawnedProcess, error;
//
//       try {
//         spawnedProcess = ChildProcess.spawn(command, args);
//       } catch (error) {
//         return reject(error);
//       }
//       spawnedProcess.on('error', reject);
//       spawnedProcess.on('exit', resolve);
//     });
//   };
//
//   const spawnUpdate = function(args) {
//     return spawn(updateDotExe, args);
//   };
//
//   const squirrelEvent = process.argv[1];
//   switch (squirrelEvent) {
//     case '--squirrel-install':
//     case '--squirrel-updated':
//       // Optionally do things such as:
//       // - Add your .exe to the PATH
//       // - Write to the registry for things like file associations and
//       //   explorer context menus
//
//       // Install desktop and start menu shortcuts
//       console.log('let us update')
//       await spawnUpdate(['--createShortcut', exeName]);
//       return true;
//
//     case '--squirrel-uninstall':
//       // Undo anything you did in the --squirrel-install and
//       // --squirrel-updated handlers
//
//       // Remove desktop and start menu shortcuts
//       await spawnUpdate(['--removeShortcut', exeName]);
//       return true;
//
//     case '--squirrel-obsolete':
//       // This is called on the outgoing version of your app before
//       // we update to the new version - it's the opposite of
//       // --squirrel-updated
//       return true;
//   }
// };
