"use strict";

var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _url = _interopRequireDefault(require("url"));
var _electron = require("electron");
var _install = _interopRequireDefault(require("./install"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
// import initService from './service';

process.on('uncaughtException', function (err) {
  console.error(err);
});

// Handle install paths
(0, _install["default"])().then(function () {
  // On windows use the local app data folder for local storage because we will store alot of userData
  if (process.platform == 'win32') {
    _electron.app.setPath('appData', process.env.LOCALAPPDATA);
    _electron.app.setPath('userData', _path["default"].join(process.env.LOCALAPPDATA, _electron.app.getName()));
  }
  _electron.app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  var mainWindow;
  function createWindow() {
    // Create the browser window.
    mainWindow = new _electron.BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(_url["default"].format({
      pathname: _path["default"].resolve(__dirname, '../dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
    mainWindow.setFullScreen(true);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });
    var hadVolume;
    mainWindow.on('focus', function () {
      if (hadVolume) {
        mainWindow.webContents.setAudioMuted(false);
      }
    });
    mainWindow.on('blur', function () {
      hadVolume = !mainWindow.webContents.isAudioMuted();
      mainWindow.webContents.setAudioMuted(true);
    });
  }

  // protocol.registerSchemesAsPrivileged([{ scheme: 'morpheus', privileges: { standard: true, secure: true } }]);

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  _electron.app.on('ready', createWindow);

  // Quit when all windows are closed.
  _electron.app.on('window-all-closed', function () {
    _electron.app.quit();
  });
  _electron.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}, function (err) {
  console.log(err);
  _electron.app.quit();
});