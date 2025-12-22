/**
 * Bone name mapping utilities for Java-to-Bedrock conversion
 */

/**
 * Maps Java bone names to Bedrock-compatible names
 * @param {string} javaBoneName - Original bone name from Java edition
 * @returns {string} Bedrock-compatible bone name
 */
function mapBoneNames(javaBoneName) {
  // Common bone name mappings between Java and Bedrock
  const boneMappings = {
    // Player/body bones
    'head': 'head',
    'body': 'body',
    'leftArm': 'left_arm',
    'rightArm': 'right_arm',
    'leftLeg': 'left_leg',
    'rightLeg': 'right_leg',
    
    // Entity specific bones
    'root': 'root',
    'base': 'base',
    'core': 'core',
    'main': 'main',
    
    // Armor stand bones
    'armorHead': 'armor_stand.head',
    'armorBody': 'armor_stand.body',
    'armorLeftArm': 'armor_stand.left_arm',
    'armorRightArm': 'armor_stand.right_arm',
    'armorLeftLeg': 'armor_stand.left_leg',
    'armorRightLeg': 'armor_stand.right_leg',
    
    // Mob specific bones
    'wing': 'wing',
    'tail': 'tail',
    'body2': 'body2',
    'tail2': 'tail2',
    'fin': 'fin',
    'fin2': 'fin2',
    
    // Horse specific bones
    'saddle': 'saddle',
    'mouth': 'mouth',
    'neck': 'neck',
    'mane': 'mane',
    'tailMain': 'tail_main',
    'tailTip': 'tail_tip',
    
    // Cat specific bones
    'whiskers': 'whiskers',
    'earLeft': 'ear_left',
    'earRight': 'ear_right',
    
    // Llama specific bones
    'carpet': 'carpet',
    
    // Boat bones
    'plank': 'plank',
    'bottom': 'bottom',
    
    // Minecart bones
    'bottom': 'bottom',
    
    // Skull/Wither bones
    'skull': 'skull',
    'head2': 'head2',
    'head3': 'head3',
    'body': 'body',
    
    // Dragon bones
    'bone': 'bone',
    'spine': 'spine',
    'wingTip': 'wing_tip',
    
    // Shulker bones
    'cap': 'cap',
    'base': 'base',
    
    // Phantom bones
    'wingTipLeft': 'wing_tip_left',
    'wingTipRight': 'wing_tip_right',
    
    // Drowned bones
    'trident': 'trident',
    
    // Fox bones
    'bushyTail': 'bushy_tail',
    'tailTip': 'tail_tip',
    'earInnerLeft': 'ear_inner_left',
    'earInnerRight': 'ear_inner_right',
    
    // Bee bones
    'stinger': 'stinger',
    
    // Goat horn bones
    'leftHorn': 'left_horn',
    'rightHorn': 'right_horn',
    
    // Glow squid bones
    'tentacle': 'tentacle',
    'tentacle2': 'tentacle2',
    'tentacle3': 'tentacle3',
    'tentacle4': 'tentacle4',
    'tentacle5': 'tentacle5',
    'tentacle6': 'tentacle6',
    'tentacle7': 'tentacle7',
    'tentacle8': 'tentacle8',
    
    // Allay bones
    'leftWing': 'left_wing',
    'rightWing': 'right_wing',
    
    // Frog bones
    'leftLegFront': 'left_leg_front',
    'rightLegFront': 'right_leg_front',
    'leftLegBack': 'left_leg_back',
    'rightLegBack': 'right_leg_back',
    'throat': 'throat',
    
    // Sniffer bones
    'head': 'head',
    'body': 'body',
    'leg1': 'leg1',
    'leg2': 'leg2',
    'leg3': 'leg3',
    'leg4': 'leg4',
    'tail1': 'tail1',
    'tail2': 'tail2',
    'tail3': 'tail3',
    'nose': 'nose',
    'topSnout': 'top_snout',
    'bottomSnout': 'bottom_snout',
    
    // Warden bones
    'head': 'head',
    'jaw': 'jaw',
    'torso': 'torso',
    'leftArm': 'left_arm',
    'rightArm': 'right_arm',
    'leftLeg': 'left_leg',
    'rightLeg': 'right_leg',
    'leftTendril': 'left_tendril',
    'rightTendril': 'right_tendril',
    'leftTendril2': 'left_tendril2',
    'rightTendril2': 'right_tendril2'
  };

  // First try exact match
  if (boneMappings[javaBoneName]) {
    return boneMappings[javaBoneName];
  }

  // If no exact match, try some common transformations
  const transformedName = transformBoneName(javaBoneName);
  
  // If transformed name is in mappings, use it
  if (boneMappings[transformedName]) {
    return boneMappings[transformedName];
  }

  // Return the transformed name as fallback
  return transformedName;
}

/**
 * Transform bone names using common patterns
 * @param {string} boneName - Original bone name
 * @returns {string} Transformed bone name
 */
function transformBoneName(boneName) {
  let transformed = boneName;

  // Convert camelCase to snake_case
  transformed = transformed
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();

  // Handle specific patterns
  const transformations = [
    // Java specific patterns
    { from: /^armor_stand/, to: 'armor_stand' },
    { from: /^player_/, to: 'player.' },
    { from: /^entity_/, to: 'entity.' },
    
    // Common Minecraft patterns
    { from: /left_arm$/, to: 'left_arm' },
    { from: /right_arm$/, to: 'right_arm' },
    { from: /left_leg$/, to: 'left_leg' },
    { from: /right_leg$/, to: 'right_leg' },
    { from: /head$/, to: 'head' },
    { from: /body$/, to: 'body' },
    { from: /tail$/, to: 'tail' },
    { from: /wing$/, to: 'wing' },
  ];

  for (const { from, to } of transformations) {
    if (from.test(transformed)) {
      transformed = transformed.replace(from, to);
      break;
    }
  }

  return transformed;
}

/**
 * Validate if a bone name is valid in Bedrock format
 * @param {string} boneName - Bone name to validate
 * @returns {boolean} True if valid
 */
function isValidBedrockBoneName(boneName) {
  // Bedrock bone names should:
  // 1. Only contain letters, numbers, dots, and underscores
  // 2. Not start or end with special characters (except dots for hierarchy)
  // 3. Not have consecutive special characters
  
  const pattern = /^[a-zA-Z0-9.]+(_[a-zA-Z0-9.]+)*$/;
  return pattern.test(boneName);
}

/**
 * Get bone hierarchy information for proper mapping
 * @param {string} boneName - Bone name
 * @returns {Object} Hierarchy information
 */
function getBoneHierarchy(boneName) {
  const parts = boneName.split('.');
  const hierarchy = [];
  
  for (let i = 0; i < parts.length; i++) {
    hierarchy.push(parts.slice(0, i + 1).join('.'));
  }
  
  return {
    parts: parts,
    hierarchy: hierarchy,
    depth: parts.length - 1,
    isHierarchical: parts.length > 1
  };
}

/**
 * Get common bone names for different entity types
 * @param {string} entityType - Type of entity (player, mob, etc.)
 * @returns {Array} Common bone names for the entity type
 */
function getCommonBoneNames(entityType) {
  const boneSets = {
    player: ['head', 'body', 'left_arm', 'right_arm', 'left_leg', 'right_leg'],
    armor_stand: ['armor_stand.head', 'armor_stand.body', 'armor_stand.left_arm', 'armor_stand.right_arm', 'armor_stand.left_leg', 'armor_stand.right_leg'],
    horse: ['body', 'neck', 'head', 'tail_main', 'tail_tip', 'left_front_leg', 'right_front_leg', 'left_back_leg', 'right_back_leg'],
    bat: ['body', 'head', 'left_wing', 'right_wing', 'left_wing_tip', 'right_wing_tip', 'left_leg', 'right_leg'],
    parrot: ['body', 'tail', 'left_wing', 'right_wing', 'head'],
    rabbit: ['body', 'head', 'left_front_leg', 'right_front_leg', 'left_back_leg', 'right_back_leg', 'tail']
  };

  return boneSets[entityType] || boneSets.player;
}

module.exports = {
  mapBoneNames,
  transformBoneName,
  isValidBedrockBoneName,
  getBoneHierarchy,
  getCommonBoneNames
};