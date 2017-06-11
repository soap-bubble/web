import bunyan from 'bunyan';
import fs from 'fs';
import Promise from 'bluebird';

import { get as getModel } from './install';
import atlasInfo from './info/atlas.json';

const logger = bunyan.createLogger({ name: 'primeDb' });
Promise.promisifyAll(fs);

export function v0tov1() {
  return getModel('Cast').find({
    fileName: { $regex: /.*deck1.*/ },
  }).exec()
    .map((cast) => {
      logger.info('Patching deck1 to Deck1', { fileName: cast.fileName });
      cast.fileName = cast.fileName.replace('deck1', 'Deck1');
      return cast.save();
    })
    .then(() => getModel('PanoAnim').find({
      __v: 0,
    }).exec().map((pa) => {
      const { fileName } = pa;
      const atlasEntry = atlasInfo[fileName];
      if (atlasEntry) {
        logger.info(`Patching ${fileName}...`);
      }
      Object.assign(pa, {
        __v: 1,
        ...atlasEntry,
      });
      return pa.save();
    }))
    .then(() => getModel('ControlledMovieCast').find({
      __v: 0,
    }).exec().map((cmc) => {
      const { fileName } = cmc;
      const atlasFileName = `${fileName}.atlas.png`;
      const atlasEntry = atlasInfo[fileName];
      if (atlasEntry) {
        logger.info(`Patching ${fileName}...`);
      }
      Object.assign(cmc, {
        __v: 1,
        ...atlasEntry,
        fileName: atlasEntry && atlasEntry.atlas ? atlasFileName : `${fileName}.png`,
      });
      return cmc.save();
    }));
}

export default function update() {
  return v0tov1();
}
