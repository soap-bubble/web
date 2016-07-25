import wagner from 'wagner-core';
import { vec3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import raf from 'raf';

function hotspotView(gl, texture, hotspots, log) {
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

  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.enableVertexAttribArray(textureCoordAttribute);

  function setMatrixUniforms() {
    gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);
  }

  function degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  const HOTSPOT_X_COORD_FACTOR = 0.00174532925199;
  const HOTSPOT_Y_COORD_FACTOR = 0.001;
  const SIZE = 0.99;

  function scaleFromHotspotToRad(h) {
    return {
      left: HOTSPOT_X_COORD_FACTOR * h.rectLeft,
      right: HOTSPOT_X_COORD_FACTOR * h.rectRight,
      top: HOTSPOT_Y_COORD_FACTOR * h.rectTop,
      bottom: HOTSPOT_Y_COORD_FACTOR * h.rectBottom
    };
  }

  function cylinderMap(x, y) {
    return {
      x: SIZE * ath.sin(y) * Math.cos(x),
      y: SIZE * Math.sin(y) * Math.sin(x),
      z: SIZE * Math.cos(y)
    };
  }

  const selfie = {
    initBuffers() {
      let vertices = [];
      let textureCoords = [];
      let cubeVertexIndices = [];

      cubeVertexPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

      hotspots.forEach((hotspot, index) => {
        const rect = scaleFromHotspotToRad(hotspot);
        const topLeft = cylinderMap(rect.top, rect.left);
        const bottomLeft = cylinderMap(rect.bottom, rect.left);
        const topRight = cylinderMap(rect.top, rect.right);
        const bottomRight = cylinderMap(rect.bottom, rect.right);
        vertices = vertices.concat([
          bottomLeft.x, bottomLeft.y, bottomLeft.z,
          bottomRight.x, bottomRight.y, bottomRight.z,
          topRight.x, topRight.y, topRight.z,
          topLeft.x, topRight.y, topLeft.z
        ]);
        textureCoords = textureCoords.concat([
          1.0, 0.0,
          0.0, 0.0,
          0.0, 1.0,
          1.0, 1.0
        ]);
        cubeVertexIndices = cubeVertexIndices.concat([
          0, 1, 2, 0, 2, 3
        ].map(i => 4 * index + i));
      });

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      cubeVertexPositionBuffer.itemSize = 3;
      cubeVertexPositionBuffer.numItems = hotspots.length * 4;

      cubeVertexTextureCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
      cubeVertexTextureCoordBuffer.itemSize = 2;
      cubeVertexTextureCoordBuffer.numItems = hotspots.length * 4;

      cubeVertexIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
      cubeVertexIndexBuffer.itemSize = 1;
      cubeVertexIndexBuffer.numItems = hotspots.length * 6;
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

      mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, 0.15));
      mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), vec3.fromValues(0, 1, 0));

      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
      gl.vertexAttribPointer(textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

      mat4.rotate(mvMatrix, mvMatrix, degToRad(-15), vec3.fromValues(0, 1, 0));

      // Bind the texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(samplerUniform, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
      setMatrixUniforms();
      gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
  };
  return selfie;
}

export const hotspot = {
  withCanvas(canvas) {
    return wagner.invoke((glInit, shaders) => {
      const gl = glInit(canvas, shaders.passThrough.fragment, shaders.passThrough.vertex);
      return hotspot.withContext(gl);
    });
  },
  withContext(gl) {
    return {
      forScene({ casts }) {
        return wagner.invoke(function (texture, logger) {
          return texture.withContext(gl).fromUrl('/img/hotspot-active.png').then(texture => {
            const hotspots = casts.filter(c => c.castId === 0);
            return hotspotView(gl, texture, hotspots, logger('hotspot'))
          });
        });
      }
    }
  }
};

wagner.constant('hotspotView', hotspotView);
wagner.constant('hotspot', hotspot);

