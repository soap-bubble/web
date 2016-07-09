import wagner from 'wagner-core';
import _ from 'lodash';

function pad(value, length) {
    return (value.toString().length < length) ? pad("0"+value, length):value;
}

export const cache = {};

export const texture = {
  withContext(gl) {
    const textureGl = {
      fromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image;
            img.src  = url;
            img.onload = () => resolve(img);
            img.onerror = () => reject(img);
          })
            .then(img => {
              const texture = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, texture);
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
              gl.bindTexture(gl.TEXTURE_2D, null);
              texture.img = img;
              return texture;
            });
      },

      fromPanoCast({ fileName }) {
        return cache[fileName]
          || (cache[fileName] = Promise
            .all(_.range(1, 25)
            .map(digit => textureGl.fromUrl(`${fileName}.${pad(digit, 2)}.PNG`))));
      }
    };
    return textureGl;
  }
}

wagner.constant('texture', texture);