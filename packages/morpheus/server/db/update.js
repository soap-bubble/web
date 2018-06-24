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
        fileName: 'GameDB/Deck3Aft/herbbutTOM',
      }).exec()
        .map((cast) => {
          if (cast.audioOnly) {
            return Promise.resolve();
          }
          logger.info('Patching herbbutTOM to be audio');
          cast.audioOnly = true;
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
    .then(() => getModel('MovieSpecialCast').find({
      actionAtEnd: { $lt: -1 },
    }).exec()
      .map((cast) => {
        if (
          cast.looping === true
          && cast.nextSceneId === 0
          && cast.startFrame === -cast.actionAtEnd
        ) {
          return Promise.resolve();
        }
        logger.info(`Patching negative actionAtEnd cast ${cast.castId}`);
        cast.looping = true;
        cast.nextSceneId = 0;
        cast.startFrame = -cast.actionAtEnd;
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
    .then(() => getModel('Scene').find({
      sceneId: 415050,
    }).exec()
      .map((scene) => {
        const advanceHotspot = scene.casts.find(cast => cast.param1 === 421040);
        if (advanceHotspot && advanceHotspot.length === 0) {
          logger.info('Patching advance while stairs up');
          advanceHotspot.comparators = [{ gameStateId: 1448, testType: 0, value: 0 }];
          scene.markModified('casts');
        }
        const removeHotspots = scene.casts.filter(({
          rectTop,
          rectBottom,
          rectLeft,
          rectRight,
          param1,
        }) =>
          rectTop === 0
          && rectBottom === 400
          && rectLeft === 0
          && rectRight === 640
          && (param1 === 1401 || param1 === 1448),
        );
        if (removeHotspots.length) {
          logger.info('Removing unessecary state changes');
          scene.casts = scene.casts.filter(cast => removeHotspots.indexOf(cast) === -1);
        }
        return scene.save();
      }))
    .then(() => getModel('Cast').find({
      fileName: 'GameDB/carnival/806065ANI',
    }).exec()
    .map((cast) => {
      if (cast) {
        if (cast.endFrame === 1 || cast.image) {
          logger.info('Making dials into anim');
          cast.endFrame = -1;
          cast.image = false;
        }
        return cast.save();
      }
      return Promise.resolve();
    }))
    .then(() => getModel('GameState').find({
      stateId: { $gte: 8006, $lte: 8008 },
    }).exec()
    .map((gamestate) => {
      if (gamestate) {
        if (gamestate.maxValue === 6) {
          logger.info('Patching weight gamestate');
          gamestate.maxValue = 5;
        }
        return gamestate.save();
      }
      return Promise.resolve();
    }))
    .then(() => getModel('Scene').find({
      sceneId: 415050,
    }).exec()
    .map((scene) => {
      const hotspot = scene.casts.find(c => c.param1 === 421040);
      if (!hotspot.comparators.length) {
        const hotspotIndex = scene.casts.indexOf(hotspot);
        scene.casts = scene.casts.slice(0, hotspotIndex).concat([{
          ...hotspot,
          comparators: [{
            gameStateId: 1448,
            testType: 0,
            value: 0,
          }],
        }]).concat(scene.casts.slice(hotspotIndex + 1));
        logger.info('Prevent user from advancing AIV maintenance cart with ladder up');
        return scene.save();
      }
      return Promise.resolve();
    }));
}
