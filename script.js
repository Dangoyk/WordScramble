// Game State
let gameState = {
    difficulty: 'easy',
    score: 0,
    streak: 0,
    bestStreak: 0,
    wordsSolved: 0,
    currentWord: '',
    scrambledWord: '',
    hintRevealed: 0,
    timerEnabled: true,
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    words: null
};

// DOM Elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    score: document.getElementById('score'),
    streak: document.getElementById('streak'),
    timer: document.getElementById('timer'),
    scrambledWord: document.getElementById('scrambled-word'),
    answerInput: document.getElementById('answer-input'),
    hintBtn: document.getElementById('hint-btn'),
    hintDisplay: document.getElementById('hint-display'),
    feedback: document.getElementById('feedback'),
    currentDifficulty: document.getElementById('current-difficulty'),
    startBtn: document.getElementById('start-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    timerToggle: document.getElementById('timer-toggle'),
    finalScore: document.getElementById('final-score'),
    wordsSolved: document.getElementById('words-solved'),
    bestStreak: document.getElementById('best-streak'),
    timePlayed: document.getElementById('time-played'),
    difficultyButtons: document.querySelectorAll('.btn-difficulty')
};

// Load words from JSON file
async function loadWords() {
    try {
        const response = await fetch('words.json');
        gameState.words = await response.json();
    } catch (error) {
        console.error('Error loading words:', error);
        // Fallback word lists if JSON fails to load
        gameState.words = {
            easy: ['CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BOOK', 'BALL', 'FISH', 'BIRD'],
            medium: ['COMPUTER', 'ELEPHANT', 'MOUNTAIN', 'OCEAN', 'LIBRARY', 'BUTTERFLY', 'ADVENTURE', 'JOURNEY', 'WONDER', 'MAGIC'],
            hard: ['EXTRAORDINARY', 'PHENOMENON', 'SOPHISTICATED', 'ARCHITECTURE', 'PHILOSOPHY', 'REVOLUTIONARY', 'EXTRAVAGANT', 'MAGNIFICENT', 'TREMENDOUS', 'FANTASTIC']
        };
    }
}

// Initialize game
async function init() {
    await loadWords();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Difficulty selection
    elements.difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.difficulty = btn.dataset.difficulty;
        });
    });

    // Set default difficulty
    document.querySelector('[data-difficulty="easy"]').classList.add('active');

    // Start game
    elements.startBtn.addEventListener('click', startGame);

    // Auto-submit when word length matches
    elements.answerInput.addEventListener('input', (e) => {
        const input = e.target.value.toUpperCase();
        // Only allow letters and limit to current word length
        const filtered = input.replace(/[^A-Z]/g, '').slice(0, gameState.currentWord ? gameState.currentWord.length : 20);
        e.target.value = filtered;
        
        // Auto-submit when length matches current word
        if (gameState.currentWord && filtered.length === gameState.currentWord.length) {
            setTimeout(() => checkAnswer(), 50);
        }
    });
    
    // Backspace clears entire input
    elements.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && elements.answerInput.value.length > 0) {
            e.preventDefault();
            elements.answerInput.value = '';
        } else if (e.key === 'Enter') {
            e.preventDefault();
            checkAnswer();
        }
    });

    // Hint button
    elements.hintBtn.addEventListener('click', revealHint);

    // Play again
    elements.playAgainBtn.addEventListener('click', () => {
        showScreen('start');
        resetGame();
    });

    // Timer toggle
    elements.timerToggle.addEventListener('change', (e) => {
        gameState.timerEnabled = e.target.checked;
    });
}

// Show specific screen
function showScreen(screen) {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');

    if (screen === 'start') {
        elements.startScreen.classList.remove('hidden');
    } else if (screen === 'game') {
        elements.gameScreen.classList.remove('hidden');
    } else if (screen === 'gameOver') {
        elements.gameOverScreen.classList.remove('hidden');
    }
}

// Start game
function startGame() {
    resetGame();
    showScreen('game');
    loadNewWord();
    startTimer();
}

// Reset game state
function resetGame() {
    gameState.score = 0;
    gameState.streak = 0;
    gameState.wordsSolved = 0;
    gameState.elapsedTime = 0;
    gameState.hintRevealed = 0;
    gameState.startTime = null;
    stopTimer();
    updateUI();
    clearFeedback();
    elements.hintDisplay.textContent = '';
    elements.answerInput.value = '';
    elements.answerInput.focus();
}

// Load new word
function loadWord(difficulty) {
    if (!gameState.words || !gameState.words[difficulty]) {
        return null;
    }
    const wordList = gameState.words[difficulty];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex].toUpperCase();
}

function loadNewWord() {
    gameState.currentWord = loadWord(gameState.difficulty);
    if (!gameState.currentWord) {
        showFeedback('Error loading word. Please refresh the page.', 'incorrect');
        return;
    }
    gameState.scrambledWord = shuffleWord(gameState.currentWord);
    gameState.hintRevealed = 0;
    
    // Quick update with minimal animation for fast pace
    elements.scrambledWord.style.opacity = '0.5';
    setTimeout(() => {
        elements.scrambledWord.textContent = gameState.scrambledWord;
        elements.scrambledWord.style.opacity = '1';
    }, 50);
    
    elements.currentDifficulty.textContent = gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1);
    elements.hintDisplay.textContent = '';
    elements.hintBtn.disabled = false;
    clearFeedback();
    elements.answerInput.value = '';
    elements.answerInput.maxLength = gameState.currentWord.length;
    elements.answerInput.focus();
}

// Shuffle word
function shuffleWord(word) {
    if (word.length <= 1) return word;
    
    let shuffled = word.split('');
    let attempts = 0;
    const maxAttempts = 50;
    
    // Multiple shuffle passes to ensure good scrambling
    do {
        // Fisher-Yates shuffle with multiple passes for better randomization
        for (let pass = 0; pass < 3; pass++) {
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        }
        
        // Ensure it's not the same as original
        if (shuffled.join('') === word) {
            attempts++;
            if (attempts >= maxAttempts) break;
            continue;
        }
        
        // For short words, ensure first and last letters are different
        if (word.length <= 4) {
            if (shuffled[0] === word[0] && shuffled[shuffled.length - 1] === word[word.length - 1]) {
                // Swap first and last if they match original positions
                [shuffled[0], shuffled[shuffled.length - 1]] = [shuffled[shuffled.length - 1], shuffled[0]];
            }
        }
        
        // Check if result is different enough (at least 2 positions different)
        let differences = 0;
        for (let i = 0; i < word.length; i++) {
            if (shuffled[i] !== word[i]) differences++;
        }
        
        // If less than 2 positions are different, reshuffle
        if (differences < 2 && word.length > 2) {
            attempts++;
            if (attempts >= maxAttempts) break;
            continue;
        }
        
        break;
    } while (attempts < maxAttempts);
    
    return shuffled.join('');
}

// Check answer
function checkAnswer() {
    const userInput = elements.answerInput.value.trim().toUpperCase();
    
    if (!userInput) {
        showFeedback('Please enter an answer!', 'incorrect');
        return;
    }

    if (userInput === gameState.currentWord) {
        // Correct answer
        const points = calculateScore(gameState.currentWord.length, gameState.elapsedTime);
        gameState.score += points;
        gameState.streak += 1;
        gameState.wordsSolved += 1;
        
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
        
        showFeedback(`Correct! +${points} points`, 'correct');
        updateUI();
        
        // Load next word immediately
        loadNewWord();
    } else {
        // Incorrect answer
        gameState.streak = 0;
        showFeedback('Incorrect! Try again.', 'incorrect');
        updateUI();
        elements.answerInput.value = '';
        elements.answerInput.focus();
    }
}

// Calculate score
function calculateScore(wordLength, timeElapsed) {
    // Base points from word length
    let basePoints = wordLength * 10;
    
    // Bonus for speed (if timer enabled)
    if (gameState.timerEnabled) {
        const timeBonus = Math.max(0, 30 - timeElapsed) * 2;
        basePoints += timeBonus;
    }
    
    // Streak multiplier
    const streakMultiplier = 1 + (gameState.streak * 0.1);
    
    return Math.floor(basePoints * streakMultiplier);
}

// Reveal hint
function revealHint() {
    if (gameState.hintRevealed >= gameState.currentWord.length) {
        elements.hintBtn.disabled = true;
        return;
    }
    
    const hintArray = gameState.currentWord.split('').map((letter, index) => {
        if (index <= gameState.hintRevealed) {
            return letter;
        }
        return '_';
    });
    
    gameState.hintRevealed++;
    elements.hintDisplay.textContent = hintArray.join(' ');
    
    if (gameState.hintRevealed >= gameState.currentWord.length) {
        elements.hintBtn.disabled = true;
    }
}

// Show feedback
function showFeedback(message, type) {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback ${type}`;
    
    if (type === 'correct') {
        // Clear feedback quickly for fast-paced gameplay
        setTimeout(() => {
            clearFeedback();
        }, 500);
    }
}

// Clear feedback
function clearFeedback() {
    elements.feedback.textContent = '';
    elements.feedback.className = 'feedback';
}

// Update UI
function updateUI() {
    elements.score.textContent = gameState.score;
    elements.streak.textContent = gameState.streak;
    
    if (gameState.timerEnabled) {
        const minutes = Math.floor(gameState.elapsedTime / 60);
        const seconds = Math.floor(gameState.elapsedTime % 60);
        elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        elements.timer.textContent = '--:--';
    }
}

// Timer functions
function startTimer() {
    if (!gameState.timerEnabled) return;
    
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        updateUI();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// Game over
function gameOver() {
    stopTimer();
    showScreen('gameOver');
    
    elements.finalScore.textContent = gameState.score;
    elements.wordsSolved.textContent = gameState.wordsSolved;
    elements.bestStreak.textContent = gameState.bestStreak;
    
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = Math.floor(gameState.elapsedTime % 60);
    elements.timePlayed.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize on page load
init();

