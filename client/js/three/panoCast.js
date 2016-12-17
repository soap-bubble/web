import {
  TextureLoader
} from 'three';
import { range } from 'lodash';

function pad(value, length) {
    return (value.toString().length < length) ? pad("0"+value, length):value;
}

export default function createPanoCast(panoCastData) {
  const selfie = {
    get data() {
      return panoCastData;
    },
    get fileNames() {
      return range(1, 25)
        .map(digit => `${selfie.fileName}.${pad(digit, 2)}.png`);
    },
    get fileName() {
      return selfie.data.fileName;
    }

  };
  return selfie;
}
