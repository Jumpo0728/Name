const JSZip = require('jszip');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate Bedrock-compatible .mcpack file from converted animations
 */
async function generateMcpack(animationData, outputPath) {
  try {
    const { animations, packName } = animationData;
    
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Create pack structure
    const packFolder = zip.folder(packName);
    
    // Add pack.mcmeta
    const packMcmeta = {
      pack: {
        pack_format: 7,
        description: "Converted Java animations for Minecraft Bedrock"
      }
    };
    
    packFolder.file('pack.mcmeta', JSON.stringify(packMcmeta, null, 2));
    
    // Add manifest.json for Bedrock
    const manifest = {
      format_version: [1, 1, 0],
      header: {
        description: "Converted Java animations for Minecraft Bedrock",
        name: `${packName} - Bedrock Animations`,
        uuid: uuidv4(),
        version: [1, 0, 0],
        min_engine_version: [1, 2, 0]
      },
      modules: [
        {
          description: "Animation module",
          type: "data",
          uuid: uuidv4(),
          version: [1, 0, 0]
        }
      ],
      dependencies: []
    };
    
    packFolder.file('manifest.json', JSON.stringify(manifest, null, 2));
    
    // Create animations folder
    const animationsFolder = packFolder.folder('animations');
    
    // Convert and add each animation
    let animationCount = 0;
    for (const animation of animations) {
      try {
        const bedrockAnimation = convertToBedrockAnimationFormat(animation);
        const fileName = `${animation.name}.json`;
        
        animationsFolder.file(fileName, JSON.stringify(bedrockAnimation, null, 2));
        animationCount++;
      } catch (error) {
        console.warn(`Failed to add animation ${animation.name}:`, error.message);
      }
    }
    
    if (animationCount === 0) {
      throw new Error('No valid animations could be added to the pack');
    }
    
    // Add animation controllers folder
    const controllersFolder = animationsFolder.folder('controllers');
    
    // Generate combined animation controller
    const controllerFile = generateAnimationController(animations, packName);
    controllersFolder.file('controller.json', JSON.stringify(controllerFile, null, 2));
    
    // Create entity folder with basic entity definitions
    const entityFolder = packFolder.folder('entity');
    const basicEntity = generateBasicEntityDefinition();
    entityFolder.file('animated_entity.json', JSON.stringify(basicEntity, null, 2));
    
    // Add documentation
    const docsFolder = packFolder.folder('docs');
    const readme = generateReadme(animationData);
    docsFolder.file('README.md', readme);
    
    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    // Save the file
    const fileName = `${packName}_bedrock_animations_${Date.now()}.zip`;
    const filePath = path.join('downloads', fileName);
    
    // Ensure downloads directory exists
    await fs.ensureDir('downloads');
    await fs.writeFile(filePath, zipBuffer);
    
    // Get file size
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      data: {
        fileName: fileName,
        filePath: filePath,
        fileSize: stats.size,
        animationCount: animationCount,
        packName: packName
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate .mcpack: ${error.message}`
    };
  }
}

/**
 * Convert animation data to Bedrock animation format
 */
function convertToBedrockAnimationFormat(animation) {
  const { animation: bedrockAnim, name, originalFile } = animation;
  
  // The animation converter already created the proper Bedrock format
  // We just need to add some metadata and ensure proper structure
  const finalAnimation = {
    format_version: "1.10.0",
    animations: {
      [name]: bedrockAnim.animations[name]
    }
  };
  
  // Add metadata
  if (originalFile) {
    finalAnimation.metadata = {
      original_file: originalFile,
      converted_from: "Minecraft Java Edition",
      converted_to: "Minecraft Bedrock Edition",
      conversion_date: new Date().toISOString(),
      conversion_tool: "Java-to-Bedrock Animation Converter"
    };
  }
  
  return finalAnimation;
}

/**
 * Generate animation controller for the animations
 */
function generateAnimationController(animations, packName) {
  const animationsMap = {};
  
  // Create animations map for controller
  for (const animation of animations) {
    animationsMap[animation.name] = `animation.${animation.name}`;
  }
  
  const controller = {
    format_version: "1.10.0",
    animation_controllers: {
      [`controller.animation.${packName}_main`]: {
        initial_state: "default",
        states: {
          default: {
            animations: animationsMap,
            transitions: []
          }
        }
      }
    }
  };
  
  return controller;
}

/**
 * Generate basic entity definition for testing animations
 */
function generateBasicEntityDefinition() {
  return {
    format_version: "1.10.0",
    "minecraft:client_entity": {
      description: {
        identifier: "converter:test_entity",
        materials: {
          default: "entity",
          transparent: "entity_alphatest"
        },
        geometry: {
          default: "geometry.test"
        },
        animation_controllers: [
          { 
            "controller.animation.test_main": "animation.controller.test_main" 
          }
        ],
        render_controllers: [
          "controller.render.test"
        ],
        textures: {
          default: "textures/entity/test"
        }
      }
    }
  };
}

/**
 * Generate README documentation for the converted pack
 */
function generateReadme(animationData) {
  const { animations, convertedCount, processingTime } = animationData;
  
  let readme = `# ${animationData.packName} - Bedrock Animation Pack

## Conversion Information
- **Source**: Minecraft Java Edition
- **Target**: Minecraft Bedrock Edition  
- **Conversion Date**: ${new Date().toLocaleDateString()}
- **Animations Converted**: ${convertedCount}
- **Processing Time**: ${processingTime}ms

## Installation Instructions

### For Minecraft Bedrock (Windows 10/11, Mobile, Console):
1. Download the .mcpack file
2. Open Minecraft Bedrock Edition
3. Go to Settings > Storage
4. Tap "Import" or "Add Storage"
5. Select the downloaded .mcpack file
6. The animations will be available in your resource packs

### For Minecraft Dungeons:
1. Extract the .mcpack file
2. Place the extracted folder in your Minecraft Dunneys resource packs directory
3. Enable the pack in the Dungeons settings

## Animation Details

### Converted Animations:
`;
  
  for (const animation of animations) {
    readme += `- **${animation.name}** (${animation.boneCount} bones, ${animation.duration.toFixed(1)}s duration)\n`;
  }
  
  readme += `
## Technical Details

### Conversion Process:
1. **Java Animation Parsing**: Extracted animation data from Java resource pack
2. **Bone Mapping**: Converted Java bone names to Bedrock-compatible names
3. **Rotation Conversion**: Transformed Euler angles to quaternions
4. **Timeline Optimization**: Optimized keyframe timing for Bedrock performance
5. **Format Compliance**: Ensured all animations meet Bedrock format specifications

### Bone Name Mappings:
- Head: \`head\`
- Body: \`body\`
- Arms: \`left_arm\`, \`right_arm\`
- Legs: \`left_leg\`, \`right_leg\`
- Entity-specific bones mapped appropriately

### Supported Animation Properties:
- ✅ Rotation (converted from Euler to quaternion)
- ✅ Position
- ✅ Scale
- ✅ Timeline keyframes
- ✅ Smooth interpolation

## Troubleshooting

### Common Issues:
1. **Animations not appearing**: Ensure you're using Minecraft Bedrock 1.2.0 or later
2. **Broken animations**: Check that your Java pack uses standard bone names
3. **Performance issues**: Reduce render distance or disable other resource packs

### Support:
If you encounter issues:
1. Verify your Java animation pack is in the correct format
2. Check Minecraft's resource pack compatibility
3. Report issues with the conversion tool

## Credits
Generated by Java-to-Bedrock Animation Converter Tool
Built with ❤️ for the Minecraft community

---
*This pack was automatically converted from Java Edition animations. Manual adjustment may be required for optimal results.*
`;
  
  return readme;
}

module.exports = {
  generateMcpack
};