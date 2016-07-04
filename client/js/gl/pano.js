import wagner from 'wagner-core';
import { vec3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import raf from 'raf';


function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column
      x, y,
      x + thickness, y,
      x, y + height,
      x, y + height,
      x + thickness, y,
      x + thickness, y + height,

      // top rung
      x + thickness, y,
      x + width, y,
      x + thickness, y + thickness,
      x + thickness, y + thickness,
      x + width, y,
      x + width, y + thickness,

      // middle rung
      x + thickness, y + thickness * 2,
      x + width * 2 / 3, y + thickness * 2,
      x + thickness, y + thickness * 3,
      x + thickness, y + thickness * 3,
      x + width * 2 / 3, y + thickness * 2,
      x + width * 2 / 3, y + thickness * 3]),
    gl.STATIC_DRAW);
}

function glTest(gl, texture) {
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

  function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
  }


  function setMatrixUniforms() {
    gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);
  }


  function degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  function animate() {
    const timeNow = new Date().getTime();
    if (lastTime != 0) {
      const elapsed = timeNow - lastTime;

      xRot += (90 * elapsed) / 1000.0;
      yRot += (90 * elapsed) / 1000.0;
      zRot += (90 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
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
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
          1.0,  1.0, -1.0,
          1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
          1.0,  1.0,  1.0,
          1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
          1.0, -1.0, -1.0,
          1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
          1.0, -1.0, -1.0,
          1.0,  1.0, -1.0,
          1.0,  1.0,  1.0,
          1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
      ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      cubeVertexPositionBuffer.itemSize = 3;
      cubeVertexPositionBuffer.numItems = 24;

      cubeVertexTextureCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
      var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
      ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
      cubeVertexTextureCoordBuffer.itemSize = 2;
      cubeVertexTextureCoordBuffer.numItems = 24;

      cubeVertexIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
      var cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
      ];
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
      cubeVertexIndexBuffer.itemSize = 1;
      cubeVertexIndexBuffer.numItems = 36;
      return dsl;
    },
    animate,
    drawScene() {

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

      mat4.identity(mvMatrix);

      mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, -5));

      mat4.rotate(mvMatrix, mvMatrix, degToRad(xRot), vec3.fromValues(1, 0, 0));
      mat4.rotate(mvMatrix, mvMatrix, degToRad(yRot), vec3.fromValues(0, 1, 0));
      mat4.rotate(mvMatrix, mvMatrix, degToRad(zRot), vec3.fromValues(0, 0, 1));

      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
      gl.vertexAttribPointer(textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(samplerUniform, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
      setMatrixUniforms();
      gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    },
  };
  return dsl;
}

function panoView(gl, textures) {
  const vertexBuffer = gl.createBuffer();
  const texCoordBuffer = gl.createBuffer();


  return {
    glDraw() {
      const y = 3;
      const size = 5;
      const deltaRadians = (1 / 23.85) * 2 * Math.PI;
      const vertices = [];
      const texCoords = [];

      textures.forEach((texture, index) => {
        // Front Face
        const radians = ((index - 1.68) * Math.PI) / 12;
        const negZ = Math.sin(radians) * size;
        const posZ = Math.sin(radians + deltaRadians) * size;
        const negX = Math.cos(radians) * size;
        const posX = Math.cos(radians + deltaRadians) * size;
        // First triangle
        texCoords.push(0);
        texCoords.push(0);
        vertices.push(negX, y, negZ);

        texCoords.push(1);
        texCoords.push(0);
        vertices.push(posX, y, posZ);

        texCoords.push(1);
        texCoords.push(1);
        vertices.push(posX, -y, posZ);

        // Second triangle
        texCoords.push(0);
        texCoords.push(1);
        vertices.push(negX, -y, negZ);

        texCoords.push(0);
        texCoords.push(0);
        vertices.push(negX, y, negZ);

        texCoords.push(1);
        texCoords.push(0);
        vertices.push(posX, y, posZ);

        // Bind the texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(gl.program, "uSampler"), 0);
      });

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
      );
      const aVertexPosition = gl.getAttribLocation(gl.program, "aVertexPosition");
      gl.enableVertexAttribArray(aVertexPosition);
      gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(texCoords),
        gl.STATIC_DRAW
      );
      const aTextureCoord = gl.getAttribLocation(gl.program, "aTextureCoord");
      gl.enableVertexAttribArray(aTextureCoord);
      gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);

      // Clear the canvas.
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 2 * textures.length);
    }
  };
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

