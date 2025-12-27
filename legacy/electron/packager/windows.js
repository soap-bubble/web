const electronInstaller = require('electron-winstaller');
const path = require('path');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: path.resolve(__dirname, '../Morpheus-win32-x64'),
    outputDirectory: path.resolve(__dirname, '../build/WinInstaller64'),
    authors: 'Soapbubble Productions',
    exe: 'Morpheus.exe'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
