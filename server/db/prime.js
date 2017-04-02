// NOTE: This file is useless to anyone who does not possess morpheus.map.json
var jf = require('jsonfile');
import { getModel } from './index';
var mongoose = require('mongoose');
var bunyan = require('bunyan');
var util = require('util');
var sprintf = require('sprintf').sprintf;

var logger = bunyan.createLogger({ name: 'primeDb' });

var passed = 0, failed = 0;
/** @type {Array} */ var items;

export default function loadMorpheus(callback) {
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
        var Model = getModel(morpheusObj.type);

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
        .catch((err) => {
          logger.error(util.inspect(err));
          throw err;
        });
    });

    // Wait for everything
    return Promise.all(everythingPassed)
      .then(function (everything) {
        logger.info(`Wrote ${everything.length} entries`);
      }, function (err) {
        logger.error('Failed to load db because: ' + util.inspect(err));
      })
      .then(callback);
  });
}
