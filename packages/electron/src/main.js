import 'regenerator-runtime/runtime';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { protocol, app, BrowserWindow } from 'electron';
import initService from './service';

// On windows use the local app data folder for local storage because we will store alot of userData
if (process.platform == 'win32') {
    app.setPath('appData', process.env.LOCALAPPDATA);
    app.setPath('userData', path.join(process.env.LOCALAPPDATA, app.getName()));
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  initService();
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: 'build/index.html',
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.setFullScreen(true);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

protocol.registerStandardSchemes(['morpheus'], { secure: true });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
