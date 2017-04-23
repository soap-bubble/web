import bunyan from 'bunyan';
import fs from 'fs';
import Promise from 'bluebird';

import { get as getModel } from './install';

const logger = bunyan.createLogger({ name: 'primeDb' });
Promise.promisifyAll(fs);

export function v0tov1() {
  const atlasInfo = require('./info/atlas.json');
  return getModel('Cast').find({
    fileName: { $regex: /.*deck1.*/ },
  }).exec()
    .map((cast) => {
      logger.info('Patching deck1 to Deck1', { fileName: cast.fileName });
      cast.fileName = cast.fileName.replace('deck1', 'Deck1');
      return cast.save();
    })
    .then(() => getModel('ControlledMovieCast').find({
      __v: 0,
    }).exec().map((cmc) => {
      const { fileName, castId } = cmc;
      const atlasFileName = `${fileName}.atlas.png`;
      const possibleAtlasFile = `../${atlasFileName}`;
      const atlasEntry = atlasInfo[fileName];
      if (atlasEntry) {
        logger.info(`Patching ${fileName}...`, atlasEntry);
      }
      Object.assign(cmc, {
        ['__v']: 1,
        ...atlasEntry,
        fileName: atlasEntry && atlasEntry.atlas ? atlasFileName : `${fileName}.png`
      });
      logger.info(`Saving ${fileName}...`, {
        model: cmc,
      });
      return cmc.save();
    }));
}

export default function update() {
  return v0tov1();
}
