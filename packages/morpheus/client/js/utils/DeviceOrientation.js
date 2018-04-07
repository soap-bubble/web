import THREE from 'three';

/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

export default function (object) {
  const scope = this;

  this.object = object;
  this.object.rotation.reorder('YXZ');

  this.enabled = true;

  this.deviceOrientation = {};
  this.screenOrientation = 0;

  this.alpha = 0;
  this.alphaOffsetAngle = 0;

  const onDeviceOrientationChangeEvent = (event) => {
    scope.deviceOrientation = event;
  };

  const onScreenOrientationChangeEvent = () => {
    scope.screenOrientation = window.orientation || 0;
  };

  // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
  const setObjectQuaternion = (() => {
    const zee = new THREE.Vector3(0, 0, 1);
    const euler = new THREE.Euler();
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(
      -Math.sqrt(0.5),
      0,
      0,
      Math.sqrt(0.5),
    ); // - PI/2 around the x-axis

    return (quaternion, alpha, beta, gamma, orient) => {
      euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
      quaternion.setFromEuler(euler); // orient the device
      quaternion.multiply(q1); // camera looks out the back of the device, not the top
      quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
    };
  })();

  this.connect = () => {
    onScreenOrientationChangeEvent(); // run once on load

    window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
    window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);

    scope.enabled = true;
  };

  this.disconnect = () => {
    window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);
    window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);

    scope.enabled = false;
  };

  this.update = () => {
    if (scope.enabled === false) return;

    const alpha =
      scope.deviceOrientation.alpha
      ? THREE.Math.degToRad(scope.deviceOrientation.alpha) + this.alphaOffsetAngle
      : 0; // Z
    const beta =
      scope.deviceOrientation.beta
      ? THREE.Math.degToRad(scope.deviceOrientation.beta)
      : 0; // X'
    const gamma =
      scope.deviceOrientation.gamma
      ? THREE.Math.degToRad(scope.deviceOrientation.gamma)
      : 0; // Y''
    const orient =
      scope.screenOrientation
      ? THREE.Math.degToRad(scope.screenOrientation)
      : 0; // O

    setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);
    this.alpha = alpha;
  };

  this.updateAlphaOffsetAngle = (angle) => {
    this.alphaOffsetAngle = angle;
    this.update();
  };

  this.dispose = () => {
    this.disconnect();
  };
  this.connect();
}
