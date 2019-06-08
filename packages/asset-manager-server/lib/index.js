"use strict";

var _express = _interopRequireDefault(require("express"));

var _multer = _interopRequireDefault(require("multer"));

var _bunyan = _interopRequireDefault(require("bunyan"));

var _config = _interopRequireDefault(require("config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var logger = _bunyan["default"].createLogger({
  name: 'asset-manager-server'
});

var app = (0, _express["default"])();
var uploadRoute = new _express["default"].Router();
var uploadMulter = (0, _multer["default"])({
  dest: _config["default"].get('uploadDest')
});
uploadRoute.put('/asset', uploadMulter.single('asset'), function (req, res) {
  res.send('OK');
});
app.use(uploadRoute);
app.use('/jaz', _express["default"]["static"](_config["default"].get('jazArchive')));

var port = _config["default"].get('port');

app.listen(port, function () {
  logger.info("Asset manager up on port ".concat(port));
});