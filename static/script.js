// Get references to HTML elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const bestScoreEl = document.getElementById("bestScore");
const currentScoreEl = document.getElementById("currentScore");
const startMessage = document.getElementById("startMessage");

// Game variables
let snake = [{ x: 200, y: 200 }];
const snakeSize = 20;
let dx = snakeSize; // Change in x (initially moving right)
let dy = 0; // Change in y (initially no vertical movement)
let food = generateFood(); // Initial food position
let score = 0; // Player's current score
let bestScore = 0; // Best score initialized
let paused = false; // Game state
let gameStarted = false; // Track if the game has started

// Fetch the best score from the server
async function fetchBestScore() {
    try {
        const response = await fetch('/getbestscore');
        if (response.ok) {
            const data = await response.json();
            bestScore = data.best_score;
            bestScoreEl.innerText = bestScore;
        } else {
            console.error('Failed to fetch best score:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching best score:', error);
    }
}

// Draw the snake on the canvas
function drawSnake() {
    ctx.fillStyle = "green";
    snake.forEach(part => {
        ctx.fillRect(part.x, part.y, snakeSize, snakeSize);
    });
}

// Move the snake and handle food consumption
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // Add new head to the snake

    // Check if the snake has eaten the food
    if (head.x === food.x && head.y === food.y) {
        score++;
        currentScoreEl.innerText = score;
        food = generateFood(); // Generate new food
    } else {
        snake.pop(); // Remove last part of the snake
    }
}

// Generate food at random position
function generateFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / snakeSize)) * snakeSize,
        y: Math.floor(Math.random() * (canvas.height / snakeSize)) * snakeSize
    };
}

// Draw food on the canvas
function drawFood() {
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, snakeSize, snakeSize);
}

// Clear the canvas for redrawing
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Handle keyboard input for controlling the game
function changeDirection(event) {
    const keyPressed = event.key;

    // Start game on spacebar
    if (!gameStarted && keyPressed === " ") {
        startGame();
        return;
    }

    // Change direction based on key pressed
    if (keyPressed === "ArrowUp" && dy === 0) {
        dx = 0; dy = -snakeSize;
    } else if (keyPressed === "ArrowDown" && dy === 0) {
        dx = 0; dy = snakeSize;
    } else if (keyPressed === "ArrowLeft" && dx === 0) {
        dx = -snakeSize; dy = 0;
    } else if (keyPressed === "ArrowRight" && dx === 0) {
        dx = snakeSize; dy = 0;
    } else if (keyPressed === "p") {
        togglePause(); // Toggle pause on 'p'
    }
}

// Start the game
function startGame() {
    gameStarted = true;
    startMessage.style.display = "none";
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    score = 0;
    currentScoreEl.innerText = score;
    gameLoop();
}

// Toggle pause state
function togglePause() {
    paused = !paused;
    pauseBtn.innerText = paused ? "Resume" : "Pause";
}

// Reset the game to initial state
function resetGame() {
    score = 0;
    currentScoreEl.innerText = score;
    snake = [{ x: 200, y: 200 }];
    dx = snakeSize;
    dy = 0;
    food = generateFood();
    paused = false;
    pauseBtn.innerText = "Pause";
}

// Check if the game is over
function checkGameOver() {
    const head = snake[0];
    const hitWall = head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height;
    const hitSelf = snake.slice(1).some(part => part.x === head.x && part.y === head.y);

    if (hitWall || hitSelf) {
        // Update best score if the current score exceeds it
        if (score > bestScore) {
            bestScore = score;
            bestScoreEl.innerText = bestScore;

            // Send the best score to the server
            fetch('/update_score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: bestScore })
            });
        }
        resetGame();
        gameStarted = false;
        startMessage.style.display = "block";
        startMessage.innerText = "Press Space to Start";
        pauseBtn.disabled = true;
        resetBtn.disabled = true;
    }
}

// Main game loop
function gameLoop() {
    if (!gameStarted || paused) return;
    clearCanvas();
    drawFood();
    moveSnake();
    drawSnake();
    checkGameOver();
    setTimeout(gameLoop, 100); // Call gameLoop every 100ms
}

// Fetch the best score when the page loads
fetchBestScore();

// Event listeners for keyboard and button interactions
document.addEventListener("keydown", changeDirection);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", resetGame);
