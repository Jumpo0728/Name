const fs = require('fs-extra');
const path = require('path');
const { convertEulerToQuaternion } = require('./mathUtils');
const { mapBoneNames } = require('./boneMapping');

/**
 * Main conversion function that transforms Java animation format to Bedrock format
 */
async function convertJavaToBedrockAnimation(javaData) {
  const startTime = Date.now();
  
  try {
    const { animations, models, packName } = javaData;
    const convertedAnimations = [];
    const conversionLog = [];

    for (const animation of animations) {
      try {
        const converted = convertSingleAnimation(animation, models);
        if (converted) {
          convertedAnimations.push(converted);
          conversionLog.push({
            fileName: animation.fileName,
            status: 'success',
            bonesConverted: converted.boneCount,
            duration: converted.duration
          });
        }
      } catch (error) {
        conversionLog.push({
          fileName: animation.fileName,
          status: 'error',
          error: error.message
        });
        console.warn(`Failed to convert ${animation.fileName}:`, error.message);
      }
    }

    if (convertedAnimations.length === 0) {
      throw new Error('No animations could be successfully converted. Please check your Java animation files for valid format.');
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        animations: convertedAnimations,
        packName: packName,
        convertedCount: convertedAnimations.length,
        processingTime,
        conversionLog
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Animation conversion failed: ${error.message}`
    };
  }
}

/**
 * Convert a single animation from Java format to Bedrock format
 */
function convertSingleAnimation(animation, models) {
  const { fileName, data: javaAnimation } = animation;
  
  // Validate Java animation structure
  if (!javaAnimation.animation) {
    throw new Error(`Invalid animation structure in ${fileName}. Missing 'animation' property.`);
  }
  
  const animations = javaAnimation.animation;
  const animationEntries = Object.entries(animations);
  
  if (animationEntries.length === 0) {
    throw new Error(`No animations found in ${fileName}`);
  }
  
  const bedrockAnimations = {};
  let boneCount = 0;
  let maxDuration = 0;

  // Process each animation in the file
  for (const [animName, animData] of animationEntries) {
    if (!animData.bones) {
      continue;
    }
    
    // Convert each animated bone
    for (const [boneName, boneData] of Object.entries(animData.bones)) {
      try {
        const convertedBone = convertBoneAnimation(boneName, boneData);
        if (convertedBone) {
          // Use bone name as animation key to avoid conflicts
          bedrockAnimations[convertedBone.name] = convertedBone.animation;
          boneCount++;
          maxDuration = Math.max(maxDuration, convertedBone.duration);
        }
      } catch (error) {
        console.warn(`Failed to convert bone ${boneName}:`, error.message);
      }
    }
  }

  if (boneCount === 0) {
    throw new Error(`No valid bones found in animation ${fileName}`);
  }

  // Create Bedrock animation structure
  const animationKeys = Object.keys(bedrockAnimations);
  if (animationKeys.length === 0) {
    throw new Error(`No animations could be created from ${fileName}`);
  }
  
  const bedrockAnimation = {
    format_version: "1.10.0",
    animations: bedrockAnimations
  };

  return {
    name: sanitizeName(fileName),
    animation: bedrockAnimation,
    boneCount,
    duration: maxDuration,
    originalFile: fileName
  };
}

/**
 * Convert individual bone animation from Java to Bedrock format
 */
function convertBoneAnimation(boneName, boneData) {
  if (!boneData.rotation && !boneData.position && !boneData.scale) {
    return null;
  }

  const bedrockBoneName = mapBoneNames(boneName);
  const convertedAnimation = {};
  
  let maxFrameTime = 0;

  // Convert rotation if present
  if (boneData.rotation) {
    const rotationAnimation = convertRotationAnimation(boneData.rotation);
    if (rotationAnimation) {
      convertedAnimation.rotation = rotationAnimation;
      maxFrameTime = Math.max(maxFrameTime, rotationAnimation.maxTime || 0);
    }
  }

  // Convert position if present
  if (boneData.position) {
    const positionAnimation = convertPositionAnimation(boneData.position);
    if (positionAnimation) {
      convertedAnimation.position = positionAnimation;
      maxFrameTime = Math.max(maxFrameTime, positionAnimation.maxTime || 0);
    }
  }

  // Convert scale if present
  if (boneData.scale) {
    const scaleAnimation = convertScaleAnimation(boneData.scale);
    if (scaleAnimation) {
      convertedAnimation.scale = scaleAnimation;
      maxFrameTime = Math.max(maxFrameTime, scaleAnimation.maxTime || 0);
    }
  }

  if (Object.keys(convertedAnimation).length === 0) {
    return null;
  }

  return {
    name: bedrockBoneName,
    animation: convertedAnimation,
    duration: maxFrameTime
  };
}

/**
 * Convert rotation animation from Java Euler angles to Bedrock quaternions
 */
function convertRotationAnimation(rotationData) {
  const timeline = [];
  let maxTime = 0;

  for (const [timeStr, rotation] of Object.entries(rotationData)) {
    const time = parseFloat(timeStr);
    maxTime = Math.max(maxTime, time);

    // Convert Euler angles (degrees) to quaternion
    const radians = rotation.map(deg => deg * Math.PI / 180); // Convert to radians
    const quaternion = convertEulerToQuaternion(radians);

    timeline.push({
      time: time,
      value: `[${quaternion.join(', ')}]`
    });
  }

  if (timeline.length === 0) {
    return null;
  }

  // Sort timeline by time
  timeline.sort((a, b) => a.time - b.time);

  return {
    timeline: timeline,
    maxTime: maxTime
  };
}

/**
 * Convert position animation
 */
function convertPositionAnimation(positionData) {
  const timeline = [];
  let maxTime = 0;

  for (const [timeStr, position] of Object.entries(positionData)) {
    const time = parseFloat(timeStr);
    maxTime = Math.max(maxTime, time);

    timeline.push({
      time: time,
      value: `[${position.join(', ')}]`
    });
  }

  if (timeline.length === 0) {
    return null;
  }

  timeline.sort((a, b) => a.time - b.time);

  return {
    timeline: timeline,
    maxTime: maxTime
  };
}

/**
 * Convert scale animation
 */
function convertScaleAnimation(scaleData) {
  const timeline = [];
  let maxTime = 0;

  for (const [timeStr, scale] of Object.entries(scaleData)) {
    const time = parseFloat(timeStr);
    maxTime = Math.max(maxTime, time);

    timeline.push({
      time: time,
      value: `[${scale.join(', ')}]`
    });
  }

  if (timeline.length === 0) {
    return null;
  }

  timeline.sort((a, b) => a.time - b.time);

  return {
    timeline: timeline,
    maxTime: maxTime
  };
}

/**
 * Sanitize filename for Bedrock compatibility
 */
function sanitizeName(filename) {
  return filename
    .replace(/\.json$/i, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[^a-zA-Z]+/, '')
    .toLowerCase();
}

module.exports = {
  convertJavaToBedrockAnimation
};