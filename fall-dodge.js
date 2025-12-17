const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let canvasWidth = 800;
let canvasHeight = 600;

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const GAME_STATE = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

const DIFFICULTY_SETTINGS = {
    easy: {
        obstacleSpeed: 2,
        obstacleSpawnRate: 0.015,
        collectibleSpawnRate: 0.02,
        speedIncrement: 0.3,
        label: 'Easy'
    },
    medium: {
        obstacleSpeed: 3,
        obstacleSpawnRate: 0.02,
        collectibleSpawnRate: 0.015,
        speedIncrement: 0.5,
        label: 'Medium'
    },
    hard: {
        obstacleSpeed: 4,
        obstacleSpawnRate: 0.025,
        collectibleSpawnRate: 0.01,
        speedIncrement: 0.7,
        label: 'Hard'
    }
};

let gameState = GAME_STATE.START;
let score = 0;
let highScore = parseInt(localStorage.getItem('fallDodgeHighScore')) || 0;
let difficulty = 'medium';
let difficultySettings = DIFFICULTY_SETTINGS[difficulty];

let player = {
    x: canvasWidth / 2,
    y: canvasHeight - 80,
    width: 30,
    height: 30,
    speed: 5,
    dx: 0,
    shakeTime: 0,
    glowPhase: 0
};

let obstacles = [];
let collectibles = [];
let particles = [];
let floatingTexts = [];
let stars = [];
let lastTime = 0;
let deltaTime = 0;

let keys = {};
let leftPressed = false;
let rightPressed = false;

let combo = 0;
let comboTimer = 0;
const COMBO_TIMEOUT = 2000;

let soundEnabled = true;
let soundContext = null;

function initAudio() {
    try {
        soundContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
        soundEnabled = false;
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (!soundEnabled || !soundContext) return;
    
    try {
        const oscillator = soundContext.createOscillator();
        const gainNode = soundContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(soundContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, soundContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, soundContext.currentTime + duration);
        
        oscillator.start(soundContext.currentTime);
        oscillator.stop(soundContext.currentTime + duration);
    } catch (e) {
        console.log('Error playing sound:', e);
    }
}

function playCollectSound() {
    playSound(800 + (combo * 100), 0.1, 'sine');
}

function playHitSound() {
    playSound(100, 0.2, 'sawtooth');
}

function createStarfield() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3
        });
    }
}

function updateStarfield(dt) {
    stars.forEach(star => {
        star.y += star.speed * dt * 60;
        if (star.y > canvasHeight) {
            star.y = 0;
            star.x = Math.random() * canvasWidth;
        }
    });
}

function drawStarfield() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function createParticles(x, y, count, color, speed = 2) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.life -= dt * 2;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function addFloatingText(text, x, y, color) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        life: 1,
        color: color
    });
}

function updateFloatingTexts(dt) {
    floatingTexts = floatingTexts.filter(t => {
        t.y -= dt * 60;
        t.life -= dt * 1.5;
        return t.life > 0;
    });
}

function drawFloatingTexts() {
    floatingTexts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    });
}

function updatePlayer(dt) {
    player.x = canvasWidth / 2;
    player.y = canvasHeight - 80;
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || leftPressed) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D'] || rightPressed) {
        player.dx = player.speed;
    } else {
        player.dx = 0;
    }
    
    player.x += player.dx * dt * 60;
    
    if (player.x < player.width / 2) {
        player.x = player.width / 2;
    }
    if (player.x > canvasWidth - player.width / 2) {
        player.x = canvasWidth - player.width / 2;
    }
    
    if (player.shakeTime > 0) {
        player.shakeTime -= dt;
    }
    
    player.glowPhase += dt * 3;
}

function drawPlayer() {
    const shakeX = player.shakeTime > 0 ? (Math.random() - 0.5) * 10 : 0;
    const shakeY = player.shakeTime > 0 ? (Math.random() - 0.5) * 10 : 0;
    
    const glowIntensity = Math.sin(player.glowPhase) * 0.3 + 0.7;
    
    ctx.save();
    ctx.shadowBlur = 20 * glowIntensity;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
    
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(player.x + shakeX, player.y + shakeY, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 10 * glowIntensity;
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(player.x + shakeX, player.y + shakeY, player.width / 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function spawnObstacle() {
    const size = Math.random() * 20 + 20;
    obstacles.push({
        x: Math.random() * (canvasWidth - size) + size / 2,
        y: -size,
        width: size,
        height: size,
        speed: difficultySettings.obstacleSpeed,
        trailPositions: []
    });
}

function updateObstacles(dt) {
    if (Math.random() < difficultySettings.obstacleSpawnRate) {
        spawnObstacle();
    }
    
    obstacles.forEach(obs => {
        obs.y += obs.speed * dt * 60;
        
        obs.trailPositions.push({ x: obs.x, y: obs.y });
        if (obs.trailPositions.length > 5) {
            obs.trailPositions.shift();
        }
    });
    
    obstacles = obstacles.filter(obs => obs.y < canvasHeight + obs.height);
}

function drawObstacles() {
    obstacles.forEach(obs => {
        obs.trailPositions.forEach((pos, i) => {
            ctx.save();
            ctx.globalAlpha = (i / obs.trailPositions.length) * 0.3;
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pos.x - obs.width / 2, pos.y - obs.height / 2, obs.width, obs.height);
            ctx.restore();
        });
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
        
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(obs.x - obs.width / 3, obs.y - obs.height / 3, obs.width / 1.5, obs.height / 1.5);
        ctx.restore();
    });
}

function spawnCollectible() {
    const size = 15;
    collectibles.push({
        x: Math.random() * (canvasWidth - size * 2) + size,
        y: -size,
        radius: size,
        speed: difficultySettings.obstacleSpeed * 0.8,
        glowPhase: Math.random() * Math.PI * 2
    });
}

function updateCollectibles(dt) {
    if (Math.random() < difficultySettings.collectibleSpawnRate) {
        spawnCollectible();
    }
    
    collectibles.forEach(col => {
        col.y += col.speed * dt * 60;
        col.glowPhase += dt * 3;
    });
    
    collectibles = collectibles.filter(col => col.y < canvasHeight + col.radius);
}

function drawCollectibles() {
    collectibles.forEach(col => {
        const glowIntensity = Math.sin(col.glowPhase) * 0.5 + 0.5;
        
        ctx.save();
        ctx.shadowBlur = 25 * glowIntensity;
        ctx.shadowColor = 'rgba(251, 191, 36, 0.9)';
        
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(col.x, col.y, col.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(col.x, col.y, col.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function checkCollisions() {
    obstacles.forEach((obs, index) => {
        const dx = player.x - obs.x;
        const dy = player.y - obs.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.width / 2 + obs.width / 2) {
            obstacles.splice(index, 1);
            createParticles(obs.x, obs.y, 15, '#ef4444', 3);
            player.shakeTime = 0.3;
            playHitSound();
            gameOver();
        }
    });
    
    collectibles.forEach((col, index) => {
        const dx = player.x - col.x;
        const dy = player.y - col.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.width / 2 + col.radius) {
            collectibles.splice(index, 1);
            
            combo++;
            comboTimer = COMBO_TIMEOUT;
            
            const multiplier = Math.min(combo, 10);
            const points = 10 * multiplier;
            score += points;
            
            createParticles(col.x, col.y, 20, '#fbbf24', 2);
            addFloatingText(`+${points}`, col.x, col.y, '#fbbf24');
            playCollectSound();
            
            updateScoreDisplay();
            updateComboDisplay();
            
            if (score % 10 === 0 && score > 0) {
                increaseSpeed();
            }
        }
    });
}

function increaseSpeed() {
    obstacles.forEach(obs => {
        obs.speed += difficultySettings.speedIncrement;
    });
    collectibles.forEach(col => {
        col.speed += difficultySettings.speedIncrement * 0.8;
    });
    difficultySettings.obstacleSpeed += difficultySettings.speedIncrement;
}

function updateComboTimer(dt) {
    if (combo > 0) {
        comboTimer -= dt * 1000;
        if (comboTimer <= 0) {
            combo = 0;
            updateComboDisplay();
        }
    }
}

function updateScoreDisplay() {
    document.getElementById('score-value').textContent = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('fallDodgeHighScore', highScore);
        document.getElementById('high-score-value').textContent = highScore;
    }
}

function updateComboDisplay() {
    const comboDisplay = document.getElementById('combo-display');
    const comboValue = document.getElementById('combo-value');
    
    if (combo > 1) {
        comboDisplay.classList.remove('hidden');
        comboValue.textContent = Math.min(combo, 10);
    } else {
        comboDisplay.classList.add('hidden');
    }
}

function gameLoop(timestamp) {
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }
    
    deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (deltaTime > 0.1) deltaTime = 0.1;
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    updateStarfield(deltaTime);
    drawStarfield();
    
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    updateCollectibles(deltaTime);
    updateParticles(deltaTime);
    updateFloatingTexts(deltaTime);
    updateComboTimer(deltaTime);
    
    checkCollisions();
    
    drawPlayer();
    drawObstacles();
    drawCollectibles();
    drawParticles();
    drawFloatingTexts();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = GAME_STATE.PLAYING;
    score = 0;
    combo = 0;
    comboTimer = 0;
    
    const selectedDifficulty = document.getElementById('difficulty-select').value;
    difficulty = selectedDifficulty;
    difficultySettings = { ...DIFFICULTY_SETTINGS[difficulty] };
    
    player.x = canvasWidth / 2;
    player.y = canvasHeight - 80;
    player.dx = 0;
    player.shakeTime = 0;
    player.glowPhase = 0;
    
    obstacles = [];
    collectibles = [];
    particles = [];
    floatingTexts = [];
    
    createStarfield();
    
    updateScoreDisplay();
    updateComboDisplay();
    
    document.getElementById('difficulty-level').textContent = difficultySettings.label;
    
    hideScreen('start-screen');
    document.getElementById('hud').classList.remove('hidden');
    
    if ('ontouchstart' in window) {
        document.getElementById('mobile-controls').classList.remove('hidden');
    }
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function pauseGame() {
    if (gameState === GAME_STATE.PLAYING) {
        gameState = GAME_STATE.PAUSED;
        showScreen('pause-screen');
    }
}

function resumeGame() {
    if (gameState === GAME_STATE.PAUSED) {
        gameState = GAME_STATE.PLAYING;
        hideScreen('pause-screen');
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function restartGame() {
    hideScreen('pause-screen');
    hideScreen('game-over-screen');
    startGame();
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    
    document.getElementById('final-score-value').textContent = score;
    document.getElementById('game-over-high-score').textContent = highScore;
    
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('mobile-controls').classList.add('hidden');
    
    showScreen('game-over-screen');
}

function returnToMenu() {
    gameState = GAME_STATE.START;
    
    hideScreen('pause-screen');
    hideScreen('game-over-screen');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('mobile-controls').classList.add('hidden');
    
    showScreen('start-screen');
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function showScreen(screenId) {
    const screen = document.getElementById(screenId);
    screen.classList.add('active');
}

function hideScreen(screenId) {
    const screen = document.getElementById(screenId);
    screen.style.animation = 'fadeOut 0.3s ease-in-out forwards';
    setTimeout(() => {
        screen.classList.remove('active');
        screen.style.animation = '';
    }, 300);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundButton = document.getElementById('sound-toggle');
    soundButton.textContent = soundEnabled ? '🔊' : '🔇';
    
    if (soundEnabled && !soundContext) {
        initAudio();
    }
}

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('pause-button').addEventListener('click', pauseGame);
document.getElementById('resume-button').addEventListener('click', resumeGame);
document.getElementById('restart-button').addEventListener('click', restartGame);
document.getElementById('quit-button').addEventListener('click', returnToMenu);
document.getElementById('play-again-button').addEventListener('click', restartGame);
document.getElementById('menu-button').addEventListener('click', returnToMenu);
document.getElementById('sound-toggle').addEventListener('click', toggleSound);

document.getElementById('left-control').addEventListener('touchstart', (e) => {
    e.preventDefault();
    leftPressed = true;
});

document.getElementById('left-control').addEventListener('touchend', (e) => {
    e.preventDefault();
    leftPressed = false;
});

document.getElementById('right-control').addEventListener('touchstart', (e) => {
    e.preventDefault();
    rightPressed = true;
});

document.getElementById('right-control').addEventListener('touchend', (e) => {
    e.preventDefault();
    rightPressed = false;
});

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === GAME_STATE.PLAYING) {
            pauseGame();
        } else if (gameState === GAME_STATE.PAUSED) {
            resumeGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('high-score-value').textContent = highScore;

initAudio();

createStarfield();
drawStarfield();
