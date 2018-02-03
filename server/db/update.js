import bunyan from 'bunyan';
import fs from 'fs';
import Promise from 'bluebird';

import { get as getModel } from './install';

const logger = bunyan.createLogger({ name: 'primeDb' });
Promise.promisifyAll(fs);

export default function update() {
  return getModel('Cast').find({
    fileName: { $regex: /(.*\/deck1\/.*)/ },
  }).exec()
    .map((cast) => {
      logger.info('Patching deck1 to Deck1', { fileName: cast.fileName });
      cast.fileName = cast.fileName.replace('deck1', 'Deck1');
      return cast.save();
    })
    .then(() => getModel('Cast').find({
      fileName: { $regex: /(.*\/harem\/.*)/ },
    }).exec()
      .map((cast) => {
        logger.info('Patching harem to Harem', { fileName: cast.fileName });
        cast.fileName = cast.fileName.replace('harem', 'Harem');
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      fileName: { $regex: /(.*\/cargoH\/.*)/ },
    }).exec()
      .map((cast) => {
        logger.info('Patching cargoH to CargoH', { fileName: cast.fileName });
        cast.fileName = cast.fileName.replace('cargoH', 'CargoH');
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 421057,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 421065) {
          return Promise.resolve();
        }
        logger.info('Patching buttom push in engine room 1');
        cast.nextSceneId = 421065;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 421058,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 421061) {
          return Promise.resolve();
        }
        logger.info('Patching buttom push in engine room 2');
        cast.nextSceneId = 421061;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 421049,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 421065) {
          return Promise.resolve();
        }
        logger.info('Patching buttom push in engine room 3');
        cast.nextSceneId = 421065;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 421051,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 421061) {
          return Promise.resolve();
        }
        logger.info('Patching buttom push in engine room 4');
        cast.nextSceneId = 421061;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 381001,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 6003) {
          return Promise.resolve();
        }
        logger.info('Patching elevator level 3');
        cast.nextSceneId = 6003;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 434001,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 6004) {
          return Promise.resolve();
        }
        logger.info('Patching elevator level 4');
        cast.nextSceneId = 6004;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 241001,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 6002) {
          return Promise.resolve();
        }
        logger.info('Patching elevator level 2');
        cast.nextSceneId = 6002;
        return cast.save();
      }))
    .then(() => getModel('Cast').find({
      castId: 241001,
    }).exec()
      .map((cast) => {
        if (cast.nextSceneId === 6002) {
          return Promise.resolve();
        }
        logger.info('Patching elevator level 2');
        cast.nextSceneId = 6002;
        return cast.save();
      }))
      ;
}
