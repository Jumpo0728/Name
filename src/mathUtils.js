/**
 * Mathematical utilities for animation conversion
 */

/**
 * Convert Euler angles (in radians) to quaternion
 * @param {Array} euler - [x, y, z] rotation in radians
 * @returns {Array} [x, y, z, w] quaternion
 */
function convertEulerToQuaternion(euler) {
  const [ex, ey, ez] = euler;
  
  // Roll (X-axis rotation)
  const cosX = Math.cos(ex / 2);
  const sinX = Math.sin(ex / 2);
  
  // Pitch (Y-axis rotation)
  const cosY = Math.cos(ey / 2);
  const sinY = Math.sin(ey / 2);
  
  // Yaw (Z-axis rotation)
  const cosZ = Math.cos(ez / 2);
  const sinZ = Math.sin(ez / 2);

  // Calculate quaternion components
  const w = cosX * cosY * cosZ + sinX * sinY * sinZ;
  const x = sinX * cosY * cosZ - cosX * sinY * sinZ;
  const y = cosX * sinY * cosZ + sinX * cosY * sinZ;
  const z = cosX * cosY * sinZ - sinX * sinY * cosZ;

  return [x, y, z, w];
}

/**
 * Convert quaternion to Euler angles (in radians)
 * @param {Array} quaternion - [x, y, z, w] quaternion
 * @returns {Array} [x, y, z] rotation in radians
 */
function convertQuaternionToEuler(quaternion) {
  const [x, y, z, w] = quaternion;
  
  // Calculate Euler angles
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  const sinp = 2 * (w * y - z * x);
  let pitch;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2;
  } else {
    pitch = Math.asin(sinp);
  }

  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [roll, pitch, yaw];
}

/**
 * Normalize a quaternion
 * @param {Array} quaternion - [x, y, z, w] quaternion
 * @returns {Array} Normalized quaternion
 */
function normalizeQuaternion(quaternion) {
  const [x, y, z, w] = quaternion;
  const length = Math.sqrt(x*x + y*y + z*z + w*w);
  
  if (length === 0) {
    return [0, 0, 0, 1]; // Return identity quaternion
  }
  
  return [x/length, y/length, z/length, w/length];
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Spherical linear interpolation between two quaternions
 * @param {Array} q1 - First quaternion [x, y, z, w]
 * @param {Array} q2 - Second quaternion [x, y, z, w]
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Array} Interpolated quaternion
 */
function slerp(q1, q2, t) {
  let [x1, y1, z1, w1] = normalizeQuaternion(q1);
  let [x2, y2, z2, w2] = normalizeQuaternion(q2);
  
  // Calculate the dot product
  const dot = x1*x2 + y1*y2 + z1*z2 + w1*w2;
  
  // If the dot product is negative, slerp won't take the shorter path. Fix by reversing one quaternion.
  if (dot < 0.0) {
    x2 = -x2; y2 = -y2; z2 = -z2; w2 = -w2;
    dot = -dot;
  }
  
  const DOT_THRESHOLD = 0.9995;
  if (dot > DOT_THRESHOLD) {
    // Quaternions are almost identical, linearly interpolate
    const result = [
      x1 + t*(x2 - x1),
      y1 + t*(y2 - y1),
      z1 + t*(z2 - z1),
      w1 + t*(w2 - w1)
    ];
    return normalizeQuaternion(result);
  }
  
  // Since dot is in range [0, DOT_THRESHOLD], acos is safe
  const theta_0 = Math.acos(dot);
  const theta = theta_0 * t;
  const sin_theta = Math.sin(theta);
  const sin_theta_0 = Math.sin(theta_0);
  
  const s1 = Math.cos(theta) - dot * sin_theta / sin_theta_0;
  const s2 = sin_theta / sin_theta_0;
  
  return [
    s1 * x1 + s2 * x2,
    s1 * y1 + s2 * y2,
    s1 * z1 + s2 * z2,
    s1 * w1 + s2 * w2
  ];
}

module.exports = {
  convertEulerToQuaternion,
  convertQuaternionToEuler,
  normalizeQuaternion,
  degToRad,
  radToDeg,
  lerp,
  slerp
};