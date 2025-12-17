// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 400;
canvas.height = 600;

// Game State
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let bestScore = Number(localStorage.getItem('flappyBestScore')) || 0;
let combo = 0;
let maxCombo = 0;

// Game Objects
const bird = {
  x: 50,
  y: 300,
  width: 34,
  height: 24,
  velocity: 0,
  rotation: 0,
  wingOffset: 0,
  maxVelocityDown: 15, // Fix: Cap downward velocity
  maxVelocityUp: -15,  // Fix: Cap upward velocity
  gravity: 0.6,
  jumpPower: -12,
  damage: 0,
  damageRecovery: 0
};

const pipes = [];
const particles = [];
const ground = {
  y: 560,
  height: 40,
  color: '#654321'
};

const pipeConfig = {
  width: 60,
  gap: 140,
  minGapY: 50,  // Fix: Ensure consistent difficulty bounds
  maxGapY: 400, // Fix: Ensure consistent difficulty bounds
  spawnX: 400,
  speed: 6
};

// Game Variables
let pipeSpawnInterval = null; // Fix: Store interval ID for clearing
let gameLoopId = null;
let frameCount = 0;
let deltaTime = 0;
let lastFrameTime = Date.now();
let fpsCounter = 0;
let showFPS = false;
let canInput = true;
let screenShakeIntensity = 0;
let screenShakeX = 0;
let screenShakeY = 0;

// Update best score display on load
document.getElementById('bestScore').textContent = bestScore;

// Event Listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', restartGame);
document.getElementById('fpsToggle').addEventListener('click', toggleFPS);

// Fix: Add both click and touch input with proper event handling
canvas.addEventListener('click', handleInput);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleInput();
  }
});

// Fix: Add touchstart and touchend for better mobile support
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInput();
}, false);

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
}, false);

function handleInput() {
  if (gameState === 'start') {
    startGame();
  } else if (gameState === 'playing' && canInput) {
    bird.velocity = bird.jumpPower;
    canInput = false;
    setTimeout(() => { canInput = true; }, 100); // Prevent multiple simultaneous inputs
  }
}

function startGame() {
  // Fix: Clear any existing interval before starting new game
  if (pipeSpawnInterval !== null) {
    clearInterval(pipeSpawnInterval);
  }

  gameState = 'playing';
  score = 0;
  combo = 0;
  maxCombo = 0;
  bird.y = 300;
  bird.velocity = 0;
  bird.damage = 0;
  pipes.length = 0;
  particles.length = 0;
  
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('score').textContent = '0';
  document.getElementById('comboDisplay').style.display = 'none';

  // Fix: Store interval ID so we can clear it later
  pipeSpawnInterval = setInterval(() => {
    if (gameState === 'playing') {
      spawnPipe();
    }
  }, 2000);

  gameLoopId = requestAnimationFrame(gameLoop);
}

function spawnPipe() {
  // Fix: Use proper bounds for pipe gap calculation
  const gapY = Math.random() * (pipeConfig.maxGapY - pipeConfig.minGapY) + pipeConfig.minGapY;
  
  pipes.push({
    x: pipeConfig.spawnX,
    gapY: gapY,
    width: pipeConfig.width,
    gap: pipeConfig.gap,
    scored: false,
    color: getRandomPipeColor()
  });
}

function getRandomPipeColor() {
  // Pipe color variation for visual interest
  const colors = ['#2ecc71', '#27ae60', '#16a085', '#229954'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function gameLoop(currentTime) {
  // Frame-independent movement and FPS calculation
  const now = Date.now();
  deltaTime = (now - lastFrameTime) / 16.67; // Normalize to 60fps frame time
  lastFrameTime = now;
  frameCount++;

  if (frameCount % 10 === 0) {
    fpsCounter = Math.round(1000 / (now - lastFrameTime));
  }

  if (gameState === 'playing') {
    update(deltaTime);
  }

  draw();

  if (gameState === 'playing' || gameState === 'gameOver') {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

function update(dt) {
  // Apply gravity with capped velocity
  bird.velocity += bird.gravity * dt;
  
  // Fix: Cap bird velocity for realistic physics
  if (bird.velocity > bird.maxVelocityDown) {
    bird.velocity = bird.maxVelocityDown;
  }
  if (bird.velocity < bird.maxVelocityUp) {
    bird.velocity = bird.maxVelocityUp;
  }

  bird.y += bird.velocity * dt;

  // Update bird rotation based on velocity
  bird.rotation = Math.min(Math.max(bird.velocity * 0.1, -0.5), 0.5);

  // Update bird wing animation
  bird.wingOffset = Math.sin(frameCount * 0.1) * 2;

  // Update damage effect
  if (bird.damage > 0) {
    bird.damage -= 0.05;
    bird.damageRecovery = Math.sin(frameCount * 0.2) * 2;
  } else {
    bird.damageRecovery = 0;
  }

  // Update pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= pipeConfig.speed * dt;

    // Score when passing pipe
    if (!pipes[i].scored && pipes[i].x + pipeConfig.width < bird.x) {
      pipes[i].scored = true;
      score++;
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      
      if (combo > 1) {
        document.getElementById('comboDisplay').style.display = 'flex';
        document.getElementById('comboValue').textContent = combo;
      }
      
      document.getElementById('score').textContent = score;
      
      // Particle effect on scoring
      createScoreParticles(pipes[i].x, pipes[i].gapY + pipeConfig.gap / 2);
    }

    // Remove off-screen pipes
    if (pipes[i].x + pipeConfig.width < 0) {
      pipes.splice(i, 1);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx * dt;
    particles[i].y += particles[i].vy * dt;
    particles[i].vy += 0.3 * dt;
    particles[i].life -= 0.02;

    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Check collisions
  checkCollisions();
}

function checkCollisions() {
  // Ceiling collision
  if (bird.y < 0) {
    endGame('ceiling');
    return;
  }

  // Ground collision
  if (bird.y + bird.height > ground.y) {
    endGame('ground');
    return;
  }

  // Pipe collision
  for (let pipe of pipes) {
    // Check if bird is horizontally aligned with pipe
    if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipe.width) {
      // Check collision with top pipe
      if (bird.y < pipe.gapY) {
        endGame('pipe');
        return;
      }
      // Check collision with bottom pipe
      if (bird.y + bird.height > pipe.gapY + pipe.gap) {
        endGame('pipe');
        return;
      }
    }
  }
}

function endGame(reason) {
  gameState = 'gameOver';

  // Fix: Clear the spawn interval when game ends
  if (pipeSpawnInterval !== null) {
    clearInterval(pipeSpawnInterval);
    pipeSpawnInterval = null;
  }

  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
  }

  // Update best score
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBestScore', bestScore.toString());
  }

  // Add collision visual feedback
  screenShakeIntensity = 0.5;
  bird.damage = 1;

  // Create collision particles
  createCollisionParticles(bird.x + bird.width / 2, bird.y + bird.height / 2);

  // Show game over screen
  setTimeout(() => {
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('bestScoreFinal').textContent = bestScore;
    document.getElementById('bestScore').textContent = bestScore;
  }, 300);
}

function createScoreParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * 4,
      vy: Math.sin(angle) * 4,
      size: 4,
      color: '#FFD700',
      life: 1
    });
  }
}

function createCollisionParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * 6,
      vy: Math.sin(angle) * 6,
      size: 3,
      color: '#FF6B6B',
      life: 1
    });
  }
}

function toggleFPS() {
  showFPS = !showFPS;
  document.getElementById('fpsCounter').style.display = showFPS ? 'block' : 'none';
}

function restartGame() {
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  gameState = 'start';
  combo = 0;
  document.getElementById('comboDisplay').style.display = 'none';
}

function draw() {
  // Apply screen shake
  if (screenShakeIntensity > 0) {
    screenShakeX = (Math.random() - 0.5) * screenShakeIntensity * 10;
    screenShakeY = (Math.random() - 0.5) * screenShakeIntensity * 10;
    screenShakeIntensity -= 0.1;
  } else {
    screenShakeX = 0;
    screenShakeY = 0;
  }

  ctx.save();
  ctx.translate(screenShakeX, screenShakeY);

  // Clear canvas
  ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#E0F6FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw clouds (simple background elements)
  drawClouds();

  // Draw pipes
  for (let pipe of pipes) {
    drawPipe(pipe);
  }

  // Draw ground with proper visual
  drawGround();

  // Draw bird
  drawBird();

  // Draw particles
  for (let particle of particles) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Draw FPS counter
  if (showFPS) {
    drawFPS();
  }
}

function drawClouds() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  
  // Animated clouds
  const cloudOffset = (frameCount * 0.3) % canvas.width;
  
  // Cloud 1
  drawCloud(100 + cloudOffset - canvas.width, 80, 40);
  drawCloud(100 + cloudOffset, 80, 40);
  
  // Cloud 2
  drawCloud(250 + cloudOffset - canvas.width, 150, 50);
  drawCloud(250 + cloudOffset, 150, 50);
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.arc(x + size * 1.2, y, size * 0.8, 0, Math.PI * 2);
  ctx.arc(x + size * 2.4, y, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipe(pipe) {
  // Top pipe
  const topPipeHeight = pipe.gapY;
  
  // Pipe cap for visual interest
  ctx.fillStyle = pipe.color;
  ctx.fillRect(pipe.x - 5, topPipeHeight - 8, pipe.width + 10, 8);
  ctx.fillRect(pipe.x, topPipeHeight - 20, pipe.width, 20);
  
  // Top pipe body
  ctx.fillStyle = pipe.color;
  ctx.fillRect(pipe.x, 0, pipe.width, topPipeHeight - 8);
  
  // Pipe border for better appearance
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, 0, pipe.width, topPipeHeight - 8);

  // Bottom pipe
  const bottomPipeY = pipe.gapY + pipe.gap;
  const bottomPipeHeight = canvas.height - bottomPipeY;

  // Pipe cap for visual interest
  ctx.fillStyle = pipe.color;
  ctx.fillRect(pipe.x - 5, bottomPipeY, pipe.width + 10, 8);
  ctx.fillRect(pipe.x, bottomPipeY + 8, pipe.width, 20);
  
  // Bottom pipe body
  ctx.fillStyle = pipe.color;
  ctx.fillRect(pipe.x, bottomPipeY + 8, pipe.width, bottomPipeHeight - 8);
  
  // Pipe border for better appearance
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, bottomPipeY + 8, pipe.width, bottomPipeHeight - 8);
}

function drawGround() {
  // Draw ground platform at bottom
  const groundGradient = ctx.createLinearGradient(0, ground.y, 0, canvas.height);
  groundGradient.addColorStop(0, '#8B4513');
  groundGradient.addColorStop(1, '#654321');
  
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, ground.y, canvas.width, ground.height);

  // Draw grass on ground
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, ground.y, canvas.width, 3);

  // Draw ground pattern
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, ground.y);
    ctx.lineTo(i + 10, ground.y + ground.height);
    ctx.stroke();
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  
  // Apply rotation for bird tilt
  ctx.rotate(bird.rotation);
  
  // Apply damage/tilt effect
  if (bird.damageRecovery !== 0) {
    ctx.rotate(bird.damageRecovery * 0.05);
  }

  // Draw bird body (yellow)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw bird eye
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(bird.width / 4, -bird.height / 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw bird pupil
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(bird.width / 4 + 2, -bird.height / 4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw bird beak
  ctx.fillStyle = '#FF6B35';
  ctx.beginPath();
  ctx.moveTo(bird.width / 2, -2);
  ctx.lineTo(bird.width / 2 + 8, 0);
  ctx.lineTo(bird.width / 2, 2);
  ctx.fill();

  // Draw bird wings with animation
  ctx.fillStyle = '#FFA500';
  
  // Left wing
  ctx.beginPath();
  ctx.arc(-bird.width / 4, bird.wingOffset, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Right wing
  ctx.beginPath();
  ctx.arc(bird.width / 4, -bird.wingOffset, 6, 0, Math.PI * 2);
  ctx.fill();

  // Draw damage effect (red tint)
  if (bird.damage > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${bird.damage * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFPS() {
  ctx.save();
  ctx.fillStyle = '#00FF00';
  ctx.font = 'bold 14px Courier New';
  ctx.fillText(`FPS: ${fpsCounter}`, 10, canvas.height - 10);
  ctx.restore();
}

// Initialize
document.getElementById('startScreen').style.display = 'flex';
document.getElementById('gameOverScreen').style.display = 'none';

// Handle visibility change to pause game
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState === 'playing') {
    if (pipeSpawnInterval !== null) {
      clearInterval(pipeSpawnInterval);
      pipeSpawnInterval = null;
    }
  }
});

// Performance monitoring - ensure smooth 60 FPS
const performanceCheck = setInterval(() => {
  if (gameState === 'playing' && fpsCounter < 50) {
    // If FPS drops significantly, could implement optimization here
    console.warn('Low FPS detected:', fpsCounter);
  }
}, 2000);

window.addEventListener('beforeunload', () => {
  clearInterval(performanceCheck);
  if (pipeSpawnInterval !== null) {
    clearInterval(pipeSpawnInterval);
  }
  if (gameLoopId !== null) {
    cancelAnimationFrame(gameLoopId);
  }
});
