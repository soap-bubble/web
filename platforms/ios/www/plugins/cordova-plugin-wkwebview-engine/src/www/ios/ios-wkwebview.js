cordova.define("cordova-plugin-wkwebview-engine.ios-wkwebview", function(require, exports, module) {
var exec = require('cordova/exec');

var WkWebKit = {
    allowsBackForwardNavigationGestures: function (allow) {
        exec(null, null, 'CDVWKWebViewEngine', 'allowsBackForwardNavigationGestures', [allow]);
    }
};

module.exports = WkWebKit;

});
