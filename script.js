const startScreen = document.querySelector('#startScreen');
const gameScreen = document.querySelector('#gameScreen');
const startButton = document.querySelector('#startButton');
const restartButton = document.querySelector('#restartButton');
const gameArea = document.querySelector('#gameArea');
const player = document.querySelector('#player');
const scoreDisplay = document.querySelector('#score');
const highScoreDisplay = document.querySelector('#highScore');
const livesDisplay = document.querySelector('#lives');
const gameOverMessage = document.querySelector('#gameOver');
const gameOverTitle = document.querySelector('#gameOverTitle');
const gameOverText = document.querySelector('#gameOverText');
const confetti = document.querySelector('#confetti');

const TOTAL_LIVES = 3;
const FINISH_SCORE = 300;
let score = 0;
let highScore = 0;
let lives = TOTAL_LIVES;
let gameRunning = false;
let finishGateCreated = false;
let obstacleTimer;
let scoreTimer;

function isSmallScreen() {
	return window.matchMedia('(max-width: 480px)').matches;
}

function startGame() {
	startScreen.classList.add('is-hidden');
	gameScreen.classList.remove('is-hidden');
	gameOverMessage.classList.add('is-hidden');
	confetti.innerHTML = '';
	gameOverTitle.textContent = 'Keep the water moving!';
	gameOverText.textContent = 'Your score: 0';
	score = 0;
	lives = TOTAL_LIVES;
	finishGateCreated = false;
	scoreDisplay.textContent = score;
	updateLives();
	document.querySelectorAll('.obstacle').forEach((obstacle) => obstacle.remove());
	gameRunning = true;
	gameArea.focus();
	const obstacleInterval = isSmallScreen() ? 2400 : 1700;
	obstacleTimer = setInterval(createObstacle, obstacleInterval);
	scoreTimer = setInterval(updateScore, 100);
}

function updateScore() {
	if (gameRunning) {
		score = Math.min(score + 1, FINISH_SCORE);
		scoreDisplay.textContent = score;
		if (score > highScore) {
			highScore = score;
			highScoreDisplay.textContent = highScore;
		}
		if (score >= FINISH_SCORE && !finishGateCreated) {
			finishGateCreated = true;
			clearInterval(obstacleTimer);
			clearInterval(scoreTimer);
			document.querySelectorAll('.obstacle').forEach((obstacle) => obstacle.remove());
			createFinishGate();
		}
	}
}

function createObstacle() {
	if (!gameRunning) return;

	const obstacle = document.createElement('div');
	const obstacleTypes = ['obstacle-short', 'obstacle-tall', 'obstacle-wide'];
	const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
	obstacle.className = `obstacle ${obstacleType}`;
	obstacle.style.left = `${gameArea.clientWidth}px`;
	gameArea.appendChild(obstacle);
	moveObstacle(obstacle);
}

function createFinishGate() {
	if (!gameRunning) return;

	const finishGate = document.createElement('div');
	finishGate.className = 'obstacle finish-well';
	finishGate.setAttribute('aria-label', 'Finish well');
	finishGate.style.left = `${gameArea.clientWidth}px`;
	gameArea.appendChild(finishGate);
	moveObstacle(finishGate);
}

function moveObstacle(obstacle) {
	let position = gameArea.clientWidth;
	const obstacleSpeed = isSmallScreen() ? 3 : 5;

	function move() {
		if (!gameRunning) return;

		position -= obstacleSpeed;
		obstacle.style.left = `${position}px`;
		if (isCollision(player, obstacle)) {
			if (obstacle.classList.contains('finish-well')) {
				if (player.classList.contains('is-jumping')) {
					winGame(obstacle);
				} else {
					missFinishGate(obstacle);
				}
				return;
			}
			loseLife(obstacle);
			return;
		}
		if (position < -60) {
			obstacle.remove();
			return;
		}
		requestAnimationFrame(move);
	}

	requestAnimationFrame(move);
}

function isCollision(firstElement, secondElement) {
	const first = firstElement.getBoundingClientRect();
	const second = secondElement.getBoundingClientRect();
	return first.left < second.right - 7 && first.right > second.left + 7 && first.top < second.bottom && first.bottom > second.top;
}

function jump() {
	if (!gameRunning || player.classList.contains('is-jumping')) return;

	player.classList.add('is-jumping');
	setTimeout(() => player.classList.remove('is-jumping'), 650);
}

function updateLives() {
	livesDisplay.innerHTML = '';
	for (let life = 0; life < TOTAL_LIVES; life += 1) {
		const lifeDrop = document.createElement('span');
		lifeDrop.className = `life-drop${life >= lives ? ' is-lost' : ''}`;
		lifeDrop.setAttribute('aria-hidden', 'true');
		livesDisplay.appendChild(lifeDrop);
	}
	livesDisplay.setAttribute('aria-label', `${lives} lives remaining`);
}

function loseLife(obstacle) {
	obstacle.remove();
	lives -= 1;
	updateLives();
	player.classList.add('is-hit');
	setTimeout(() => player.classList.remove('is-hit'), 350);

	if (lives === 0) {
		endGame();
	}
}

function missFinishGate(obstacle) {
	loseLife(obstacle);
	setTimeout(createFinishGate, 900);
}

function winGame(obstacle) {
	obstacle.remove();
	gameRunning = false;
	clearInterval(obstacleTimer);
	clearInterval(scoreTimer);
	gameOverTitle.textContent = 'You reached the well!';
	gameOverText.textContent = `Amazing work! You successfully delivered water to the well!`;
	gameOverMessage.classList.remove('is-hidden');
	createConfetti();
}

function createConfetti() {
	const colors = ['#ffc907', '#2e9df7', '#159a48', '#f16061', '#ff902a'];
	for (let piece = 0; piece < 34; piece += 1) {
		const confettiPiece = document.createElement('span');
		confettiPiece.className = 'confetti-piece';
		confettiPiece.style.backgroundColor = colors[piece % colors.length];
		confettiPiece.style.left = `${Math.random() * 100}%`;
		confettiPiece.style.animationDelay = `${Math.random() * 0.6}s`;
		confettiPiece.style.setProperty('--confetti-rotation', `${Math.random() * 360}deg`);
		confetti.appendChild(confettiPiece);
	}
}

function endGame() {
	gameRunning = false;
	clearInterval(obstacleTimer);
	clearInterval(scoreTimer);
	gameOverTitle.textContent = 'Keep the water moving!';
	gameOverText.textContent = `Your score: ${score}`;
	gameOverMessage.classList.remove('is-hidden');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
document.addEventListener('keydown', (event) => {
	if (event.code === 'Space') {
		event.preventDefault();
		jump();
	}
});
