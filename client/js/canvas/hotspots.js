import wagner from 'wagner-core';
import { vec2, vec3, vec4 } from 'gl-matrix';

const MAX_X = 3600.0;
const DELTA_THETA_2 = 22.5;
const X_HOTSPOT_COORD_LENGTH = 450.0;
const X_HOTSPOT_COORD_LENGTH_2 = 450.0 / 2.0;
const VIEWPORT_PERCENTAGE = 45.0 / 360.0;
const VIEWPORT_PERCENTAGE_2 = 45.0 / 360.0 / 2.0;
const MAX_Y = 250;
const MIN_Y = -250;

/*
 * From http://jeshua.me/blog/gluUnprojectvariantforWebgl
 * unproject - convert screen coordinate to WebGL Coordinates
 *   winx, winy - point on the screen
 *   winz       - winz=0 corresponds to newPoint and winzFar corresponds to farPoint
 *   mat        - model-view-projection matrix
 *   viewport   - array describing the canvas [x,y,width,height]
 */
function unproject(winx,winy,winz,mat,viewport){
  winx = 2 * (winx - viewport[0])/viewport[2] - 1;
  winy = 2 * (winy - viewport[1])/viewport[3] - 1;
  winz = 2 * winz - 1;
  var invMat = mat4.create();
  mat4.inverse(mat,invMat);
  var n = [winx,winy,winz,1]
  mat4.multiplyVec4(invMat,n,n);
  return [n[0]/n[3],n[1]/n[3],n[2]/n[3]]
}

__gluMultMatrixVecd(outVector4, matrix4, inVector4) {
  for (let i = 0; i < 4; i++) {
    outVector4[0] = inVector4[0] * matrix4[0*4+i] +
	    inVector4[1] * matrix4[1*4+i] +
	    inVector4[2] * matrix4[2*4+i] +
	    inVector4[3] * matrix4[3*4+i];
    }
}

/**
 * Based on https://chromium.googlesource.com/chromium/deps/mesa/+/6da96107e2467063c72e1ec5804f0618a6ce83d3/src/glu/sgi/libutil/project.c
 */

function project(vector3D,
	      mvMatrix,
	      pMatrix,
        viewport,
	      outVector2D) {
  let in = vec4.fromValues(vector3D[0], vector3D[1], vector3D[2], 1.0);
  let out = mvM
  double out[4];
    in[0]=objx;
    in[1]=objy;
    in[2]=objz;
    in[3]=1.0;
    __gluMultMatrixVecd(modelMatrix, in, out);
    __gluMultMatrixVecd(projMatrix, out, in);
    if (in[3] == 0.0) return(GL_FALSE);
    in[0] /= in[3];
    in[1] /= in[3];
    in[2] /= in[3];
    /* Map x, y and z to range 0-1 */
    in[0] = in[0] * 0.5 + 0.5;
    in[1] = in[1] * 0.5 + 0.5;
    in[2] = in[2] * 0.5 + 0.5;
    /* Map x,y to viewport */
    in[0] = in[0] * viewport[2] + viewport[0];
    in[1] = in[1] * viewport[3] + viewport[1];
    *winx=in[0];
    *winy=in[1];
    *winz=in[2];
    return(GL_TRUE);
}

function canvasToViewport(caonvas) {
  return [0, 0, canvas.width, canvas.height];
}

function map2Dto3D(out2D, posCyl, forwardVector, viewport, mvMatrix, pMatrix) {
  const size = 1.0;
  const radians = (posCyl.x / MAX_X) * 2 * Math.PI;
  const posZ = Math.sin( radians ) * size;
  const posX = Math.cos( radians ) * size;
  const posY = posCyl.y * -0.012;
  // Find the dot product of the forward vector and the point vector
  const cp = posX * fowardVector[0] + posY * fowardVector[1] + posZ * fowardVector[2];
  // Only positive dot products are in front of the camera
  if (cp > 0) {
      // Translate the 3D point to screen coordinates

      const posScreen = unproject( posX, posY, posZ, mvMatrix, viewport)
          if (winZ > 0) {
              // Translate from the OpenGL coordinates
              returnPoint.setX( winX );
              returnPoint.setY( viewport[3] - winY );
              //qDebug() << "hotspot point: " << returnPoint;
              return true;
          }
      }
  }
  return false;
}

function hotspot(hotspotData, canvas) {
  const data = hotspotData;

  const dsl = {
    drawHotspot(mvMatrix, pMatrix) {
      const forwardVector = vec3.create(
        -mvMatrix[2],
        -mvMatrix[6],
        -mvMatrix[10]
      );
    }
  };

  return dsl;
}

function hotspots(scene, canvas) {
  const data = scene.casts.filter(c => castId === 0);
  const dsl = {

  };

  return dsl;
}