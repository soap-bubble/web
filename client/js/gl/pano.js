import wagner from 'wagner-core';
import { vec3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import raf from 'raf';

function panoView(gl, textures, log) {
  let cubeVertexIndexBuffer;
  let cubeVertexPositionBuffer;
  let cubeVertexTextureCoordBuffer;
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
  const vertexPositionAttribute = gl.getAttribLocation(gl.program, "aVertexPosition");
  const textureCoordAttribute = gl.getAttribLocation(gl.program, "aTextureCoord");

  function setMatrixUniforms() {
    gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);
  }

  function degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  const dsl = {
    initBuffers() {
      let vertices = [];

      cubeVertexPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
      vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0
      ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      cubeVertexPositionBuffer.itemSize = 3;
      cubeVertexPositionBuffer.numItems = 4;

      cubeVertexTextureCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
      var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
      ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
      cubeVertexTextureCoordBuffer.itemSize = 2;
      cubeVertexTextureCoordBuffer.numItems = 4;

      cubeVertexIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
      var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
      ];
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
      cubeVertexIndexBuffer.itemSize = 1;
      cubeVertexIndexBuffer.numItems = 6;
      return dsl;
    },
    drawScene() {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

      mat4.identity(mvMatrix);

      mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, -0.25));

      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
      gl.vertexAttribPointer(textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

      textures.forEach((texture, index) => {
        mat4.rotate(mvMatrix, mvMatrix, degToRad(-15), vec3.fromValues(0, 1, 0));

        // Bind the texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
      });
    }
  };
  return dsl;
}

export const pano = {
  withCanvas(canvas) {
    return wagner.invoke((glInit, shaders) => {
      const gl = glInit(canvas, shaders.passThrough.fragment, shaders.passThrough.vertex);
      return pano.withContext(gl);
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
            const dsl = glTest(gl, texture);
            dsl.initBuffers();
            function tick() {
              raf(tick);
              dsl.animate();
              dsl.drawScene();
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

wagner.constant('panoView', panoView);
wagner.constant('pano', pano);

