var jf = require('jsonfile');
var config = require('config');
var morpheus = require('./lib/models/morpheus');
var mongoose = require('mongoose');
var bunyan = require('bunyan');
var util = require('util');
var sprintf = require('sprintf').sprintf;

var logger = bunyan.createLogger({ name: 'primeDb' });

var passed = 0, failed = 0;
/** @type {Array} */ var items;

mongoose.connect(config.mongodb.uri, {server:{auto_reconnect:true}});
var db = mongoose.connection;
morpheus.install(db);

function loadMorpheus(callback) {
  jf.readFile('morpheus.map.json', function (err, obj) {
    if (err) throw err;
    logger.info('Morpheus JSON loaded.');

    if (util.isArray(obj)) {
      items = obj;
    } else {
      throw new Error("I don't parse single objects for some reason");
    }

    if (!items || items && !items.length) {
      logger.warn('No objects to process');
    }

    var length = items.length;
    logger.info(sprintf('Processing %d objects', length));

    var everythingPassed = items.map(function (morpheusObj, index) {
      return new Promise((resolve, reject) => {
        // Create model
        var Model = morpheus.get(morpheusObj.type);

        if (!Model) {
          reject('Failed to create DB Model for ' + morpheusObj.type);
        } else {
          var model = new Model(morpheusObj.data);
          model.save(function (err, model) {
            if (err) {
              reject(err, model);
            } else {
              resolve(model);
            }
          });
        }
      })
        .then(function (model) {
          // Reset display
          process.stdout.cursorTo(0);
          process.stdout.write(sprintf('(%d/%d)', ++passed, length));
          return model;
        }, function (err) {
          logger.error(util.inspect(err));
          throw err;
        });
    });

    // Wait for everything
    return Promise.all(everythingPassed)
      .then(function (everything) {
        process.stdout.write('\n');
        close();
      }, function (err) {
        logger.error('Failed to load db because: ' + util.inspect(err));
        close();
      });
  });
}

db.once('open', () => {
  loadMorpheus();
})

function close() {
  db.close();
  process.exit();
}