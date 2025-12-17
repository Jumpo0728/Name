# Fall Dodge Game

A fast-paced browser-based game where you dodge falling obstacles and collect glowing orbs!

## Features

### Gameplay
- **Dodge falling obstacles** - Red squares fall from the sky, avoid them!
- **Collect golden orbs** - Increase your score by collecting collectibles
- **Combo system** - Collect items consecutively for up to 10x multiplier
- **Progressive difficulty** - Game speed increases every 10 points
- **Three difficulty levels** - Easy, Medium, and Hard

### Visual Effects
- Particle effects on collisions and collections
- Floating score animations
- Player shake effect when hit
- Glowing auras around player and collectibles
- Trail effects behind obstacles
- Animated starfield background
- Smooth UI transitions

### Controls
- **Desktop**: Arrow Keys or WASD to move left/right
- **Mobile**: Touch buttons to move left/right
- **Pause**: P key or ESC key, or click the pause button

### Features
- High score persistence using localStorage
- Sound effects with toggle (Web Audio API)
- Fully responsive design
- Frame rate independent movement
- Accurate circular collision detection
- Multiple game states (Start, Playing, Paused, Game Over)

## How to Play

1. Open `fall-dodge.html` in a web browser
2. Select your difficulty level
3. Click "Start Game"
4. Move left/right to dodge red obstacles
5. Collect golden orbs to increase your score
6. Chain collections to build your combo multiplier
7. Try to beat your high score!

## Technical Details

### Bug Fixes Implemented
1. ✅ Score only increases from collecting items (not from time/frameCount)
2. ✅ Speed increases every 10 points (fixed % 10 logic, not % 100)
3. ✅ Accurate circular collision detection using distance calculation
4. ✅ Pause button properly pauses the game with event listener
5. ✅ Keyboard controls (Arrow keys and WASD)
6. ✅ Sound toggle with actual Web Audio API implementation

### Design Improvements
- Particle effects system
- Score float-up animations
- Player shake on collision
- Glowing auras and trails
- Starfield background
- Enhanced button states
- Combo multiplier system
- Better color scheme
- Pause menu styling
- Visual difficulty indicator

### Technical Improvements
- Frame rate independent movement using deltaTime
- requestAnimationFrame for smooth rendering
- Proper game state management
- Touch control support with visual feedback
- Memory efficient particle/array cleanup
- Responsive canvas sizing
- No memory leaks
- Error handling for Web Audio API

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- Web Audio API (optional, for sound effects)
- LocalStorage (for high score)

## Files

- `fall-dodge.html` - Main game page
- `fall-dodge.css` - Styling and animations
- `fall-dodge.js` - Game logic and engine

## License

Open source - feel free to modify and share!
