import wagner from 'wagner-core';
import { vec3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import raf from 'raf';
import { tessellation } from '../canvas/triangles';

function panoView(gl, textures, log) {
  let sphereVertexIndexBuffer;
  let sphereVertexPositionBuffer;
  let sphereVertexTextureCoordBuffer;
  let coordSphere;
  let texSphere;
  let lastTime = 0;
  let xRot = 0;
  let yRot = 0;
  let zRot = 0;

  var mvMatrix = mat4.create();
  var mvMatrixStack = [];
  var pMatrix = mat4.create();

  const pMatrixUniform = gl.getUniformLocation(gl.program, "uPMatrix");
  const mvMatrixUniform = gl.getUniformLocation(gl.program, "uMVMatrix");
  const samplerUniform = gl.getUniformLocation(gl.program, "uSampler");
  const vertexPositionAttribute = gl.getAttribLocation(gl.program, "aPlanePosition");
  const textureCoordAttribute = gl.getAttribLocation(gl.program, "aPlaneTextureCoord");

  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.enableVertexAttribArray(textureCoordAttribute);

  function setMatrixUniforms() {
    gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);
  }

  function degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  const selfie = {
    initBuffers() {
      coordSphere = tessellation([Math.PI / 12, Math.PI / 2], [10, 5], [-Math.PI / 24, -Math.PI / 4]);
      texSphere = tessellation([1, 1], [10, 5], [-Math.PI, -Math.PI / 2]);

      sphereVertexPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordSphere.vertexCoords), gl.STATIC_DRAW);

      sphereVertexTextureCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texSphere.vertexCoords), gl.STATIC_DRAW);

      sphereVertexIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordSphere.vertexIndex), gl.STATIC_DRAW);

      return selfie;
    },
    animate() {
      let lastTime = 0;
      function tick() {
        raf(tick);

        const timeNow = new Date().getTime();
        if (lastTime != 0) {
            const elapsed = timeNow - lastTime;
            xRot += (90 * elapsed) / 5000.0;
        }
        lastTime = timeNow;

        selfie.drawScene();
      }
      tick();
    },
    drawScene() {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

      mat4.identity(mvMatrix);

      mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, 0));
      mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), vec3.fromValues(0, 1, 0));

      gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, coordSphere.vertexCoordSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
      gl.vertexAttribPointer(textureCoordAttribute, coordSphere.vertexCoordSize, gl.FLOAT, false, 0, 0);

      textures.forEach((texture, index) => {
        mat4.rotate(mvMatrix, mvMatrix, degToRad(-15), vec3.fromValues(0, 1, 0));

        // Bind the texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, coordSphere.vertexIndexSize, gl.UNSIGNED_SHORT, 0);
      });
    }
  };
  return selfie;
}

export const sphere = {
  withCanvas(canvas) {
    return wagner.invoke((glInit, shaders) => {
      const gl = glInit(canvas, shaders.spherical.fragment, shaders.spherical.vertex);
      return sphere.withContext(gl);
    });
  },
  withContext(gl) {
    return {
      forUrl(url) {
        return new Promise((resolve, reject) => {
          wagner.invoke(texture => {
            resolve(texture.withContext(gl).fromUrl(url));
          });
        })
          .then(texture => {
            const selfie = glTest(gl, texture);
            selfie.initBuffers();
            function tick() {
              raf(tick);
              selfie.animate();
              selfie.drawScene();
            }
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            tick();
          });
      },
      forScene({ casts }) {
        return wagner.invoke((texture, logger) => {
          return new Promise((resolve, reject) => {
            const panoCast = casts.find(c => c.__t === 'PanoCast');
            if (panoCast) {
              resolve(texture.withContext(gl).fromPanoCast(panoCast));
            } else {
              reject(new Error('Failed to find a PanoCast'));
            }
          })
            .then(textures => {
              return panoView(gl, textures, logger('pano'));
            });
        });
      }
    }
  }
};

wagner.constant('sphereView', panoView);
wagner.constant('sphere', sphere);

