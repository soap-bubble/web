"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;
var _electron = require("electron");
var _menuTemplate = _interopRequireDefault(require("./menuTemplate"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _default() {
  if (process.env.NODE_ENV === 'development') {} else {
    _electron.Menu.setApplicationMenu(_menuTemplate["default"]);
  }
}