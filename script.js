const startScreen = document.querySelector('#startScreen');
const gameScreen = document.querySelector('#gameScreen');
const completionScreen = document.querySelector('#completionScreen');
const startButton = document.querySelector('#startButton');
const restartButton = document.querySelector('#restartButton');
const completionRestartButton = document.querySelector('#completionRestartButton');
const gameArea = document.querySelector('#gameArea');
const player = document.querySelector('#player');
const milestoneMessage = document.querySelector('#milestoneMessage');
const scoreDisplay = document.querySelector('#score');
const highScoreDisplay = document.querySelector('#highScore');
const livesDisplay = document.querySelector('#lives');
const gameOverMessage = document.querySelector('#gameOver');
const gameOverTitle = document.querySelector('#gameOverTitle');
const gameOverText = document.querySelector('#gameOverText');
const confetti = document.querySelector('#confetti');

const TOTAL_LIVES = 3;
const FINISH_SCORE = 350;
const DIFFICULTY_STEP = 50;
const SPEED_INCREASE_PER_LEVEL = 0.75;
let score = 0;
let highScore = 0;
let lives = TOTAL_LIVES;
let gameRunning = false;
let finishGateCreated = false;
let difficultyLevel = 0;
let obstacleTimer;
let scoreTimer;

function isSmallScreen() {
	return window.matchMedia('(max-width: 480px)').matches;
}

function startGame() {
	startScreen.classList.add('is-hidden');
	gameScreen.classList.remove('is-hidden');
	completionScreen.classList.add('is-hidden');
	gameOverMessage.classList.add('is-hidden');
	confetti.innerHTML = '';
	gameOverTitle.textContent = 'Keep the water moving!';
	gameOverText.textContent = 'Your score: 0';
	milestoneMessage.classList.add('is-hidden');
	score = 0;
	lives = TOTAL_LIVES;
	finishGateCreated = false;
	difficultyLevel = 0;
	scoreDisplay.textContent = score;
	updateLives();
	document.querySelectorAll('.obstacle').forEach((obstacle) => obstacle.remove());
	gameRunning = true;
	gameArea.focus();
	startObstacleTimer();
	scoreTimer = setInterval(updateScore, 100);
}

function getObstacleInterval() {
	const baseInterval = isSmallScreen() ? 2400 : 1700;
	return Math.max(700, baseInterval - difficultyLevel * 125);
}

function startObstacleTimer() {
	obstacleTimer = setInterval(createObstacle, getObstacleInterval());
}

function updateDifficulty() {
	const newDifficultyLevel = Math.floor(score / DIFFICULTY_STEP);
	if (newDifficultyLevel !== difficultyLevel) {
		difficultyLevel = newDifficultyLevel;
		clearInterval(obstacleTimer);
		startObstacleTimer();
	}
}

function updateScore() {
	if (gameRunning) {
		score = Math.min(score + 1, FINISH_SCORE);
		scoreDisplay.textContent = score;
		updateDifficulty();
		if (score === 150) {
			milestoneMessage.classList.remove('is-hidden');
			setTimeout(() => milestoneMessage.classList.add('is-hidden'), 1800);
		}
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
	const baseSpeed = isSmallScreen() ? 3 : 5;
	const obstacleSpeed = baseSpeed + difficultyLevel * SPEED_INCREASE_PER_LEVEL;

	function move() {
		if (!gameRunning) return;

		position -= obstacleSpeed;
		obstacle.style.left = `${position}px`;
		const isFinishGate = obstacle.classList.contains('finish-well');
		if (isFinishGate && isHorizontalOverlap(player, obstacle)) {
			winGame(obstacle);
			return;
		}
		if (isCollision(player, obstacle)) {
			obstacle.remove();
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

function isHorizontalOverlap(firstElement, secondElement) {
	const first = firstElement.getBoundingClientRect();
	const second = secondElement.getBoundingClientRect();
	return first.left < second.right && first.right > second.left;
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
	gameScreen.classList.add('is-hidden');
	completionScreen.classList.remove('is-hidden');
	if (typeof window.confetti === 'function') {
		window.confetti({ particleCount: 160, spread: 85, origin: { y: 0.6 } });
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
completionRestartButton.addEventListener('click', startGame);
document.addEventListener('keydown', (event) => {
	if (event.code === 'Space') {
		event.preventDefault();
		jump();
	}
});
