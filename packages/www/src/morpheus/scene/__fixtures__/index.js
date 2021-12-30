import {
  merge,
  isNumber,
  isArray,
} from 'lodash';

export const castData = {
  fileName: 'GameDB/file',
  __t: 'TestType',
};

export const sceneData = {
  sceneId: 0,
  sceneType: 0,
  casts: [castData],
};

export default function Index(_data) {
  let data = merge({
    ...sceneData,
  }, _data);
  const self = {
    get data() {
      return data;
    },
    withCasts(casts) {
      if (isNumber(casts)) {
        const newCasts = [...sceneData.casts];
        for (let i = 0; i <= casts; i++) {
          newCasts.push({
            ...castData,
          });
        }
        data = {
          ...data,
          casts: newCasts,
        };
      } else if (isArray(casts)) {
        data = {
          ...data,
          casts: [...data.casts, ...casts],
        };
      }
      return self;
    },
  };
  return self;
}
