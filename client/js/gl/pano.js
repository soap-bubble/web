import wagner from 'wagner-core';
import _ from 'lodash';

function panoView(gl, textures) {
  return {
    glDraw() {
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const y = 3;
      const size = 5;
      const deltaRadians = (1 / 23.85) * 2 * Math.PI;

      textures.forEach((texture, index) => {
        // Front Face
        const radians = ((index - 1.68) * Math.PI) / 12;
        const negZ = Math.sin( radians ) * size;
        const posZ = Math.sin( radians + deltaRadians) * size;
        const negX = Math.cos( radians ) * size;
        const posX = Math.cos( radians + deltaRadians) * size;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.begin(gl.QUADS);
        gl.texCoord2f(0, 0);
        gl.vertex3f( negX, y, negZ);
        gl.texCoord2f(1, 0);
        gl.vertex3f( posX,  y,  posZ);
        gl.texCoord2f(1, 1);
        gl.vertex3f( posX,  -y,  posZ);
        gl.texCoord2f(0, 1);
        gl.vertex3f( negX,  -y,  negZ);
        g.end();
      });
    }
  }
}

export const pano = {
  withContext(gl) {
    return {
      forScene({ casts }) {
        return new Promise((resolve, reject) => {
          wagner.invoke((texture) => {
            const panoCast = casts.find(c => c.__t === 'PanoCast');
            if (panoCast) {
              resolve(texture.withContext(gl).fromPanoCast(panoCast));
            } else {
              reject(new Error('Failed to find a PanoCast'));
            }
          });
        })
          .then(textures => {
            return panoView(gl, textures);
          });
      }
    }
  }
};

wagner.constant('panoView', panoView);
wagner.constant('pano', pano);