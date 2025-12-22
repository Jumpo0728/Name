# Minecraft Java-to-Bedrock Animation Converter

A fully functional web-based tool that converts Minecraft Java Edition animation resource packs to Bedrock-compatible format. Built with React frontend and Node.js/Express backend.

## Features

### 🎯 Core Functionality
- **Smart Animation Parsing**: Extracts and analyzes Java animation JSON files from ZIP packs
- **Advanced Format Conversion**: 
  - Converts Euler angles to quaternions
  - Maps Java bone names to Bedrock-compatible names
  - Preserves animation timing and properties
- **Instant .mcpack Generation**: Creates ready-to-use Bedrock resource packs
- **Real-time Progress Tracking**: Shows conversion progress with detailed status updates

### 🎨 User Interface
- **Drag & Drop Upload**: Simple file upload with drag-and-drop support
- **Mobile Responsive**: Works perfectly on all devices
- **Animation Preview**: Shows converted animations with bone count and duration
- **Error Handling**: Clear error messages with helpful troubleshooting info
- **Professional Design**: Modern, clean interface with Minecraft-themed colors

### ⚡ Technical Features
- **Fast Processing**: Typically completes conversions in under 30 seconds
- **File Size Support**: Handles packs up to 50MB
- **Robust Error Handling**: Validates input and provides detailed feedback
- **Production Ready**: Built for deployment with proper logging and monitoring

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **JSZip** for Java pack parsing
- **Multer** for file uploads
- **Custom conversion engine** with mathematical utilities
- **CORS** enabled for cross-origin requests

### Frontend
- **React 18** with modern hooks
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Dropzone** for file uploads
- **Lucide React** for icons
- **Axios** for API communication

### Deployment
- **Vercel** ready configuration
- **Automatic builds** for frontend and backend
- **Environment variable** support
- **Global CDN** distribution

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone and install dependencies**:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

2. **Build the frontend**:
```bash
cd client && npm run build && cd ..
```

3. **Start the server**:
```bash
npm start
```

4. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - Upload a Java animation resource pack ZIP file
   - Wait for conversion to complete
   - Download your Bedrock-ready .mcpack file

### Directory Structure
```
/
├── server.js                 # Express server
├── src/                      # Backend source code
│   ├── animationConverter.js # Main conversion logic
│   ├── boneMapping.js       # Java-to-Bedrock bone name mapping
│   ├── mathUtils.js         # Euler-to-quaternion conversion
│   └── mcpackGenerator.js   # .mcpack file generation
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── App.jsx         # Main app component
│   └── dist/               # Built frontend (auto-generated)
├── uploads/                 # Temporary file storage
├── downloads/              # Generated .mcpack files
└── vercel.json            # Deployment configuration
```

## How It Works

### 1. Java Animation Analysis
The tool scans uploaded ZIP files for:
- Animation JSON files (typically in `animations/` folder)
- Model files for bone name reference
- Pack metadata and structure validation

### 2. Format Conversion Process
**Rotation Conversion**:
- Java uses Euler angles (X, Y, Z) in degrees
- Bedrock uses quaternions (X, Y, Z, W) for smooth rotations
- Mathematical conversion preserves animation fidelity

**Bone Name Mapping**:
```
Java Name          →  Bedrock Name
head              →  head
leftArm           →  left_arm
rightArm          →  right_arm
armorStand_head   →  armor_stand.head
```

**Timeline Optimization**:
- Preserves keyframe timing
- Optimizes interpolation for Bedrock performance
- Maintains animation smoothness

### 3. Bedrock Pack Generation
Creates proper Bedrock structure:
```
converted_pack/
├── manifest.json           # Pack metadata
├── pack.mcmeta            # Pack format info
├── animations/            # Converted animations
│   ├── controller.json   # Animation controller
│   └── [animation].json  # Individual animations
├── entity/                # Entity definitions
└── docs/                  # Documentation
```

## API Endpoints

### POST /api/convert
Upload and convert Java animation pack.

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body: `animation-pack` (ZIP file)

**Response**:
```json
{
  "success": true,
  "data": {
    "animationsFound": 5,
    "animationsConverted": 5,
    "downloadUrl": "/api/download/filename.zip",
    "fileName": "converted_pack.zip",
    "fileSize": 245760,
    "processingTime": 15234
  }
}
```

### GET /api/download/:fileName
Download converted .mcpack file.

### GET /api/health
Check service health status.

## Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Set environment variables** (if needed):
```bash
vercel env add NODE_ENV
vercel env add PORT
```

### Other Platforms

The application can be deployed to:
- **Heroku**: Use provided `Procfile`
- **Netlify**: Configure build settings
- **Railway**: Automatic deployment
- **DigitalOcean**: App Platform compatible

## Usage Examples

### Java Animation Pack Structure
```
my-java-animation-pack.zip
├── pack.mcmeta
├── animations/
│   ├── idle.json
│   ├── walk.json
│   └── attack.json
└── models/
    └── entity/
        └── player.json
```

### Converted Bedrock Pack Structure
```
my-converted-bedrock-pack.mcpack
├── manifest.json
├── pack.mcmeta
├── animations/
│   ├── controller.json
│   ├── idle.json
│   ├── walk.json
│   └── attack.json
├── entity/
│   └── animated_entity.json
└── docs/
    └── README.md
```

## Troubleshooting

### Common Issues

**"No animation files found"**
- Ensure your Java pack contains JSON files in `animations/` folder
- Check that animation files have valid JSON structure
- Verify file names contain "animation" keyword

**"Conversion failed"**
- Check that your Java pack uses standard bone names
- Ensure animations follow Java Edition format
- Try with a smaller, simpler animation pack first

**"Download failed"**
- Refresh the page and try again
- Check your browser's download folder
- Ensure you have sufficient storage space

### Performance Optimization

**For large animation packs**:
- Reduce file size by removing unused textures
- Split very large packs into smaller batches
- Use compression tools for the ZIP file

**For slow conversions**:
- Close other browser tabs
- Use a wired internet connection
- Try converting during off-peak hours

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

We welcome contributions! Please see our contributing guidelines for:
- Bug reports and feature requests
- Code contributions and pull requests
- Documentation improvements
- Translation efforts

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord server for help and discussion

## Acknowledgments

- **Minecraft Community**: For inspiration and feedback
- **Mojang Studios**: For creating the amazing Minecraft universe
- **Open Source Libraries**: React, Express, Vite, and many others

---

**Made with ❤️ for the Minecraft community**

Convert your Java animations to Bedrock format and bring your creations to more platforms!