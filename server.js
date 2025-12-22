const express = require('express');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { convertJavaToBedrockAnimation } = require('./src/animationConverter');
const { generateMcpack } = require('./src/mcpackGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'), false);
    }
  }
});

// API Routes
app.post('/api/convert', upload.single('animation-pack'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a Java animation resource pack (.zip)'
      });
    }

    const fileId = uuidv4();
    const uploadPath = path.join('uploads', fileId);
    const tempPath = req.file.path;

    console.log(`Processing animation pack: ${req.file.originalname}`);

    // Ensure upload directory exists
    await fs.ensureDir(uploadPath);

    try {
      // Move uploaded file to temporary location
      await fs.move(tempPath, path.join(uploadPath, 'original.zip'));

      // Step 1: Extract and analyze Java animation pack
      const analysisResult = await analyzeJavaPack(uploadPath);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error);
      }

      // Step 2: Convert animations to Bedrock format
      const conversionResult = await convertJavaToBedrockAnimation(analysisResult.data);
      
      if (!conversionResult.success) {
        throw new Error(conversionResult.error);
      }

      // Step 3: Generate Bedrock .mcpack file
      const mcpackResult = await generateMcpack(conversionResult.data, uploadPath);

      if (!mcpackResult.success) {
        throw new Error(mcpackResult.error);
      }

      // Clean up temporary files
      await fs.remove(uploadPath);

      // Return success with download info
      res.json({
        success: true,
        data: {
          animationsFound: analysisResult.data.animations.length,
          animationsConverted: conversionResult.data.convertedCount,
          downloadUrl: `/api/download/${mcpackResult.data.fileName}`,
          fileName: mcpackResult.data.fileName,
          fileSize: mcpackResult.data.fileSize,
          processingTime: conversionResult.data.processingTime
        }
      });

    } catch (error) {
      // Clean up on error
      await fs.remove(uploadPath);
      throw error;
    }

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert animation pack'
    });
  }
});

app.get('/api/download/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join('downloads', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.download(filePath, `${fileName.replace('.zip', '')}.mcpack`, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to download file'
        });
      } else {
        // Clean up downloaded file after a delay
        setTimeout(async () => {
          try {
            await fs.remove(filePath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }, 60000); // 1 minute delay
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve download'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Minecraft Java-to-Bedrock Animation Converter'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

async function analyzeJavaPack(packPath) {
  try {
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    const zipContent = await fs.readFile(path.join(packPath, 'original.zip'));
    const javaPack = await zip.loadAsync(zipContent);

    const animations = [];
    const models = [];
    let foundAnimations = false;

    // Look for animation files
    for (const [filename, file] of Object.entries(javaPack.files)) {
      if (file.dir) continue;

      const fileName = filename.toLowerCase();
      
      // Find animation files
      if (fileName.includes('animation') && fileName.endsWith('.json')) {
        foundAnimations = true;
        try {
          const content = await file.async('text');
          const animationData = JSON.parse(content);
          
          animations.push({
            fileName: filename,
            data: animationData
          });
        } catch (parseError) {
          console.warn(`Failed to parse animation file ${filename}:`, parseError.message);
        }
      }
      
      // Find model files for bone mapping
      if ((fileName.includes('model') || fileName.includes('geometry')) && fileName.endsWith('.json')) {
        try {
          const content = await file.async('text');
          const modelData = JSON.parse(content);
          
          models.push({
            fileName: filename,
            data: modelData
          });
        } catch (parseError) {
          console.warn(`Failed to parse model file ${filename}:`, parseError.message);
        }
      }
    }

    if (!foundAnimations) {
      return {
        success: false,
        error: 'No animation files found in the Java resource pack. Please ensure the pack contains animation JSON files.'
      };
    }

    return {
      success: true,
      data: {
        animations,
        models,
        packName: extractPackName(javaPack) || 'converted-pack'
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to analyze Java pack: ${error.message}`
    };
  }
}

function extractPackName(zip) {
  // Try to find manifest or pack info
  for (const filename of Object.keys(zip.files)) {
    if (filename.toLowerCase().includes('pack.mcmeta')) {
      return 'java-animations';
    }
  }
  return 'java-animations';
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minecraft Java-to-Bedrock Animation Converter running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;